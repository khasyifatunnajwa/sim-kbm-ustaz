
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIREBASE_SERVICE_ACCOUNT = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64url(value: string | Uint8Array): string {
  const bytes = typeof value === "string"
    ? new TextEncoder().encode(value)
    : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function pemToBytes(pem: string): Uint8Array {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  return Uint8Array.from(atob(clean), c => c.charCodeAt(0));
}

async function getFirebaseAccessToken(account: {
  client_email: string;
  private_key: string;
}) {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));

  const unsigned = `${header}.${claim}`;
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsigned),
  );

  const assertion = `${unsigned}.${base64url(new Uint8Array(signature))}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.access_token) {
    throw new Error("Firebase OAuth gagal: " +
      JSON.stringify(result).slice(0, 500));
  }

  return result.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Gunakan metode POST." }, 405);
  }

  try {
    if (!FIREBASE_SERVICE_ACCOUNT) {
      return json({ error: "Secret Firebase belum tersedia." }, 500);
    }

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ error: "Konfigurasi Supabase belum lengkap." }, 500);
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const bearer = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!bearer) {
      return json({ error: "Autentikasi diperlukan." }, 401);
    }

    // Service-role key hanya boleh digunakan dari lingkungan tepercaya.
    const isServiceRole = bearer === SERVICE_ROLE_KEY;

    if (!isServiceRole) {
      const { data: authData, error: authError } =
        await supabase.auth.getUser(bearer);

      if (authError || !authData.user) {
        return json({ error: "Sesi pengguna tidak valid." }, 401);
      }

      const payload = await req.json();
      const { user_id, title, body, data: extraData, broadcast } = payload;

      if (broadcast === true) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Gagal memeriksa peran admin:", profileError.message);
          return json({ error: "Gagal memverifikasi hak admin." }, 500);
        }

        if (profile?.role !== "admin") {
          return json({ error: "Hanya admin yang boleh mengirim broadcast." }, 403);
        }

        if (
          typeof title !== "string" || !title.trim() ||
          typeof body !== "string" || !body.trim()
        ) {
          return json({ error: "Judul dan isi notifikasi wajib diisi." }, 400);
        }

        const { data: recipients, error: recipientsError } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "ustaz")
          .eq("is_active", true);

        if (recipientsError) {
          console.error("Gagal membaca daftar ustaz:", recipientsError.message);
          return json({ error: "Gagal membaca daftar ustaz aktif." }, 500);
        }

        let sent = 0;
        let failedDevices = 0;
        let failedRecipients = 0;
        let totalDevices = 0;

        for (const recipient of recipients ?? []) {
          const response = await sendNotification(
            recipient.id, title, body, extraData,
          );
          const result = await response.json();

          if (response.ok) {
            const recipientSent = Number(result.sent) || 0;
            sent += recipientSent;
            totalDevices += Number(result.total_devices) || 0;
            failedDevices += Number(result.failed) || 0;

            if (recipientSent <= 0 || result.success !== true) {
              failedRecipients++;
            }
          } else {
            failedRecipients++;
            failedDevices += Number(result.failed) || 0;
            console.error("Gagal mengirim ke ustaz:", recipient.id, result);
          }
        }

        return json({
          success: sent > 0,
          sent,
          total_devices: totalDevices,
          failed_devices: failedDevices,
          failed_recipients: failedRecipients,
          total_recipients: (recipients ?? []).length,
          message: sent > 0
            ? "Broadcast diproses; periksa rincian kegagalan."
            : "Belum ada perangkat yang berhasil menerima broadcast.",
        });
      }

      if (!user_id || user_id !== authData.user.id) {
        return json({
          error: "Pengguna hanya boleh mengirim notifikasi ke dirinya sendiri.",
        }, 403);
      }

      return await sendNotification(user_id, title, body, extraData);
    }

    const payload = await req.json();
    const { user_id, title, body, data: extraData } = payload;

    return await sendNotification(user_id, title, body, extraData);
  } catch (error) {
    console.error("send-push-notification error:", error);
    return json({
      error: error instanceof Error ? error.message : "Terjadi kesalahan.",
    }, 500);
  }
});

async function sendNotification(
  userId: string,
  title: string,
  body: string,
  extraData?: Record<string, unknown>,
) {
  if (
    typeof userId !== "string" ||
    typeof title !== "string" ||
    typeof body !== "string" ||
    !title.trim() ||
    !body.trim()
  ) {
    return json({
      error: "user_id, title, dan body wajib diisi dengan benar.",
    }, 400);
  }

  const { data: devices, error } = await supabase
    .from("device_tokens")
    .select("id, token")
    .eq("user_id", userId);

  if (error) {
    console.error("Gagal membaca device_tokens:", error.message);
    return json({ error: "Gagal membaca token perangkat." }, 500);
  }

  const tokens = [...new Set(
    (devices ?? []).map(device => device.token).filter(Boolean),
  )];

  if (!tokens.length) {
    return json({
      success: true,
      sent: 0,
      message: "Pengguna belum memiliki token perangkat.",
    });
  }

  const account = JSON.parse(FIREBASE_SERVICE_ACCOUNT!) as {
    client_email: string;
    private_key: string;
    project_id: string;
  };

  const accessToken = await getFirebaseAccessToken(account);
  let sent = 0;
  let invalidTokens = 0;

  for (const token of tokens) {
    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body },
              data: Object.fromEntries(
                Object.entries(extraData ?? {}).map(([key, value]) => [
                  key, String(value),
                ]),
              ),
            },
          }),
        },
      );

      if (response.ok) {
        sent++;
      } else {
        const responseText = await response.text();
        let fcmError: any = {};
        try {
          fcmError = JSON.parse(responseText)?.error ?? {};
        } catch {
          // Respons bukan JSON.
        }

        const errorCode = Array.isArray(fcmError.details)
          ? fcmError.details.find((item: any) =>
              item?.["@type"] ===
                "type.googleapis.com/google.firebase.fcm.v1.FcmError"
            )?.errorCode
          : undefined;

        if (errorCode === "UNREGISTERED") invalidTokens++;

        console.error("FCM gagal:", {
          status: response.status,
          statusText: fcmError.status,
          errorCode,
        });
      }
    } catch (error) {
      console.error(
        "Gangguan jaringan FCM:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return json({
    success: sent > 0,
    sent,
    total_devices: tokens.length,
    failed: tokens.length - sent,
    invalid_tokens: invalidTokens,
    message: sent > 0
      ? "Permintaan pengiriman diterima Firebase."
      : "Tidak ada pengiriman yang berhasil.",
  });
}
