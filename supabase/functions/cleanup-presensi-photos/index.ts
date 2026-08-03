import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Hapus foto setelah 3×24 jam = 72 jam
const RETENTION_HOURS = 72;

function extractFilePath(photoUrl: string): string | null {
  try {
    const url = new URL(photoUrl);
    const marker = "/object/public/presensi-ustaz/";
    const idx = url.pathname.indexOf(marker);
    if (idx !== -1) return url.pathname.slice(idx + marker.length);
    // fallback: split on bucket name
    const parts = url.pathname.split("/presensi-ustaz/");
    if (parts.length >= 2) return parts[1];
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date();
    const cutoff = new Date(now.getTime() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();

    const { data: expiredRecords, error: fetchError } = await supabase
      .from("presensi_ustaz")
      .select("id, photo_url, guru_id, jam_server")
      .not("photo_url", "is", null)
      .eq("photo_expired", false)
      .lt("jam_server", cutoff);

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!expiredRecords || expiredRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No expired photos to clean up",
          cleaned: 0,
          retention_hours: RETENTION_HOURS,
          cutoff_time: cutoff,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let deletedCount = 0;
    let failedCount = 0;

    for (const record of expiredRecords) {
      if (!record.photo_url) continue;

      try {
        const filePath = extractFilePath(record.photo_url);

        if (filePath) {
          const { error: removeError } = await supabase.storage
            .from("presensi-ustaz")
            .remove([filePath]);

          if (removeError) {
            console.error(`Failed to delete file ${filePath}:`, removeError.message);
            failedCount++;
          } else {
            deletedCount++;
          }
        } else {
          console.warn(`Cannot parse path from URL: ${record.photo_url}`);
          failedCount++;
        }

        // Tandai sebagai expired terlepas dari berhasil/tidaknya hapus file
        await supabase
          .from("presensi_ustaz")
          .update({ photo_url: null, photo_expired: true })
          .eq("id", record.id);
      } catch (err) {
        console.error(`Error processing record ${record.id}:`, err);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${deletedCount} photos, ${failedCount} failed`,
        cleaned: deletedCount,
        failed: failedCount,
        total_processed: expiredRecords.length,
        retention_hours: RETENTION_HOURS,
        cutoff_time: cutoff,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
