import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateIdLogin(namaPanggilan: string, namaLengkap: string): string {
  const source = namaPanggilan?.trim() || namaLengkap.split(" ")[0];
  return source
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";
}

function primaryRole(roles: string[]): string {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("operator")) return "operator";
  return "ustaz";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user: callerUser }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service client — has full access
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Confirm caller has admin role
    const { data: callerProfile } = await serviceClient
      .from("profiles")
      .select("role, roles")
      .eq("id", callerUser.id)
      .maybeSingle();

    const callerIsAdmin =
      callerProfile?.role === "admin" ||
      (Array.isArray(callerProfile?.roles) && callerProfile.roles.includes("admin"));

    if (!callerIsAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action = "create" } = body;

    // ── RESET PASSWORD ──────────────────────────────────────────────────
    if (action === "reset-password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password) {
        return new Response(JSON.stringify({ error: "user_id and new_password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new_password.length < 6) {
        return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await serviceClient.auth.admin.updateUserById(user_id, {
        password: new_password,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: "Password berhasil direset" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CREATE USER ─────────────────────────────────────────────────────
    const { nama_lengkap, nama_panggilan, nomor_whatsapp, password, roles = ["ustaz"], is_active = true, jenis_kelamin, boleh_mengajar } = body;

    if (!nama_lengkap) {
      return new Response(JSON.stringify({ error: "Nama lengkap wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: "Password minimal 6 karakter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(roles) || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Pilih minimal satu jabatan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique id_login
    let baseId = generateIdLogin(nama_panggilan || "", nama_lengkap);
    if (!baseId) baseId = "user";

    let finalId = baseId;
    let attempt = 0;
    while (true) {
      const { data: existing } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("id_login", finalId)
        .maybeSingle();
      if (!existing) break;
      attempt++;
      const suffix = Math.floor(100 + Math.random() * 900);
      finalId = `${baseId}${suffix}`;
      if (attempt > 10) {
        finalId = `${baseId}${Date.now().toString().slice(-5)}`;
        break;
      }
    }

    const email = `${finalId}@simkbm.local`;
    const primRole = primaryRole(roles);

    // Create auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nama_lengkap, role: primRole },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: "Gagal membuat user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Wait for auth trigger to fire (creates profile row)
    await new Promise((r) => setTimeout(r, 700));

    const profilePayload: Record<string, unknown> = {
      nama_lengkap,
      nama_panggilan: nama_panggilan || nama_lengkap.split(" ")[0],
      nomor_whatsapp: nomor_whatsapp || null,
      email,
      id_login: finalId,
      role: primRole,
      roles,
      is_active,
      jenis_kelamin: jenis_kelamin || null,
      boleh_mengajar: boleh_mengajar || null,
    };

    // Try update first (trigger may have already created the row), fallback to insert
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update(profilePayload)
      .eq("id", authData.user.id);

    if (updateError) {
      // Row might not exist yet — insert
      const { error: insertError } = await serviceClient
        .from("profiles")
        .insert({ id: authData.user.id, ...profilePayload });
      if (insertError) {
        console.error("Profile insert error:", insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User berhasil ditambahkan",
        user: {
          id: authData.user.id,
          email,
          id_login: finalId,
          role: primRole,
          roles,
        },
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
