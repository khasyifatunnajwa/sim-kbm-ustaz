import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Find presensi records with photos older than 24 hours that haven't been expired yet
    const { data: expiredRecords, error: fetchError } = await supabase
      .from("presensi_ustaz")
      .select("id, photo_url, guru_id, created_at")
      .not("photo_url", "is", null)
      .eq("photo_expired", false)
      .lt("jam_server", twentyFourHoursAgo);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!expiredRecords || expiredRecords.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No expired photos to clean up", cleaned: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let deletedCount = 0;
    let failedCount = 0;

    for (const record of expiredRecords) {
      if (!record.photo_url) continue;

      try {
        // Extract the file path from the URL
        // URL format: https://<project>.supabase.co/storage/v1/object/public/presensi-ustaz/<path>
        const urlObj = new URL(record.photo_url);
        const pathSegments = urlObj.pathname.split("/presensi-ustaz/");
        if (pathSegments.length < 2) {
          // Try alternate format
          const filePath = urlObj.pathname.split("/object/public/presensi-ustaz/")[1];
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
          }
        } else {
          const filePath = pathSegments[1];
          const { error: removeError } = await supabase.storage
            .from("presensi-ustaz")
            .remove([filePath]);

          if (removeError) {
            console.error(`Failed to delete file ${filePath}:`, removeError.message);
            failedCount++;
          } else {
            deletedCount++;
          }
        }

        // Mark the record as expired regardless of file deletion success
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
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
