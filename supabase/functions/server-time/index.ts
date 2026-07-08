import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const now = new Date();
    const serverTime = now.toISOString();
    const serverDate = now.toISOString().split("T")[0];
    const serverHour = now.toTimeString().split(" ")[0];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return new Response(
      JSON.stringify({
        server_time: serverTime,
        server_date: serverDate,
        server_hour: serverHour,
        timezone: timezone,
        timestamp: now.getTime(),
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
