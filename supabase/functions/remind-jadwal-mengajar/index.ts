
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const REMINDER_SECRET = Deno.env.get("JADWAL_REMINDER_SECRET") ?? "";
const SEND_ENABLED =
  Deno.env.get("JADWAL_REMINDER_SEND_ENABLED") === "true";

const TIME_ZONE = "Asia/Jakarta";
const REMINDER_OFFSETS = [60, 15] as const;
const MAX_ATTEMPTS = 5;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function jakartaParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((p) => [p.type, p.value]));
}

function weekdayIndonesia(value: string) {
  const names: Record<string, string> = {
    Monday: "Senin",
    Tuesday: "Selasa",
    Wednesday: "Rabu",
    Thursday: "Kamis",
    Friday: "Jumat",
    Saturday: "Sabtu",
    Sunday: "Ahad",
  };

  return names[value] ?? "";
}

function parseStartMinute(value: unknown): number | null {
  const match = String(value ?? "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) return null;

  return hour * 60 + minute;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Gunakan metode POST." }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !REMINDER_SECRET) {
    return json(
      { error: "Konfigurasi server belum lengkap." },
      500,
    );
  }

  if (
    req.headers.get("x-jadwal-reminder-secret") !== REMINDER_SECRET
  ) {
    return json({ error: "Akses ditolak." }, 401);
  }

  try {
    const payload = await req.json().catch(() => ({}));
    const mode = payload?.mode;

    if (mode !== "preview" && mode !== "send") {
      return json({
        error: "Mode tidak diizinkan.",
        allowed_modes: ["preview", "send"],
        sent: 0,
      }, 400);
    }

    // Pengiriman tetap terkunci sampai diaktifkan secara eksplisit.
    if (mode === "send" && !SEND_ENABLED) {
      return json({
        error: "Pengiriman masih dinonaktifkan di konfigurasi server.",
        mode,
        sent: 0,
      }, 403);
    }

    const now = new Date();
    const parts = jakartaParts(now);
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    const day = weekdayIndonesia(parts.weekday);
    const currentMinute =
      Number(parts.hour) * 60 + Number(parts.minute);

    if (!day || !Number.isFinite(currentMinute)) {
      return json({
        error: "Gagal menentukan waktu Jakarta.",
      }, 500);
    }

    const { data: schedules, error } = await supabase
      .from("jadwal_mengajar")
      .select(
        "id,hari,jam_mulai,jam_selesai,kelas,pelajaran,ruangan,user_id,guru_pengganti_id,is_libur",
      )
      .eq("hari", day)
      .or("is_libur.eq.false,is_libur.is.null");

    if (error) {
      console.error("Gagal membaca jadwal:", error.message);
      return json({
        error: "Gagal membaca jadwal dari database.",
      }, 500);
    }

    const candidates = (schedules ?? []).flatMap((s) => {
      if (s.is_libur === true) return [];

      const startMinute = parseStartMinute(s.jam_mulai);
      if (startMinute === null) return [];

      const minutesUntil = startMinute - currentMinute;

      // Tidak mengirim pengingat setelah jam mulai.
      if (minutesUntil < 1 || minutesUntil > 60) return [];

      const recipients = [
        s.user_id,
        s.guru_pengganti_id,
      ].filter(
        (id): id is string =>
          typeof id === "string" && id.length > 0,
      );

      return REMINDER_OFFSETS
        .filter((offset) => minutesUntil <= offset)
        .map((offset) => ({
          jadwal_id: s.id,
          tanggal_pelajaran: today,
          hari: s.hari,
          jam_mulai: s.jam_mulai,
          jam_selesai: s.jam_selesai,
          kelas: s.kelas,
          pelajaran: s.pelajaran,
          ruangan: s.ruangan,
          menit_sebelum: offset,
          menit_menuju_mulai: minutesUntil,
          penerima_ids: [...new Set(recipients)],
        }));
    });

    if (mode === "preview") {
      return json({
        success: true,
        mode,
        timezone: TIME_ZONE,
        waktu_pemeriksaan: now.toISOString(),
        tanggal_jakarta: today,
        hari: day,
        jumlah_jadwal_cocok: candidates.length,
        candidates,
        sent: 0,
        message: "Preview saja. Tidak ada notifikasi yang dikirim.",
      });
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    const results: Array<Record<string, unknown>> = [];

    for (const schedule of candidates) {
      for (const recipientId of schedule.penerima_ids) {
        // Klaim atomik mencegah klaim ganda oleh scheduler.
        const { data: claimed, error: claimError } =
          await supabase.rpc("claim_jadwal_reminder", {
            p_jadwal_id: schedule.jadwal_id,
            p_tanggal_pelajaran: schedule.tanggal_pelajaran,
            p_penerima_id: recipientId,
            p_menit_sebelum: schedule.menit_sebelum,
            p_menit_menuju_mulai: schedule.menit_menuju_mulai,
          });

        if (claimError) {
          console.error(
            "Klaim pengingat gagal:",
            claimError.message,
          );

          failed++;
          results.push({
            jadwal_id: schedule.jadwal_id,
            penerima_id: recipientId,
            status: "claim_error",
          });
          continue;
        }

        if (claimed !== true) {
          skipped++;
          continue;
        }

        let deliverySent = false;
        let failureReason =
          "Layanan push tidak mengonfirmasi pengiriman.";

        try {
          const pushResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/send-push-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({
                user_id: recipientId,
                title: "Pengingat Jadwal Mengajar",
                body: `${schedule.pelajaran || "Pelajaran"} — ${
                  schedule.kelas || "Kelas"
                }. Pengingat ${schedule.menit_sebelum} menit sebelum jadwal mengajar. Jam mulai: ${schedule.jam_mulai}.`,
                data: {
                  type: "jadwal_reminder",
                  jadwal_id: schedule.jadwal_id,
                  tanggal_pelajaran: schedule.tanggal_pelajaran,
                  jam_mulai: schedule.jam_mulai,
                  menit_sebelum: schedule.menit_sebelum,
                },
              }),
            },
          );

          const pushResult = await pushResponse
            .json()
            .catch(() => ({}));

          deliverySent =
            pushResponse.ok &&
            Number(pushResult?.sent) > 0;

          if (!deliverySent) {
            failureReason =
              `Push gagal atau tidak ada perangkat yang menerima (HTTP ${pushResponse.status}).`;
          }
        } catch {
          failureReason =
            "Tidak dapat menghubungi layanan push.";
        }

        const nextStatus = deliverySent ? "sent" : "failed";

        const { error: updateError } = await supabase
          .from("jadwal_reminder_log")
          .update({
            status: nextStatus,
            pesan_error: deliverySent ? null : failureReason,
            sent_at: deliverySent
              ? new Date().toISOString()
              : null,
          })
          .eq("jadwal_id", schedule.jadwal_id)
          .eq("tanggal_pelajaran", schedule.tanggal_pelajaran)
          .eq("penerima_id", recipientId)
          .eq("menit_sebelum", schedule.menit_sebelum)
          .eq("status", "pending");

        if (updateError) {
          console.error(
            "Gagal memperbarui log pengingat:",
            updateError.message,
          );

          failed++;
          results.push({
            jadwal_id: schedule.jadwal_id,
            penerima_id: recipientId,
            status: "log_update_error",
          });
          continue;
        }

        if (deliverySent) {
          sent++;
          results.push({
            jadwal_id: schedule.jadwal_id,
            penerima_id: recipientId,
            status: "sent",
          });
        } else {
          failed++;
          results.push({
            jadwal_id: schedule.jadwal_id,
            penerima_id: recipientId,
            status: "failed",
            reason: failureReason,
          });
        }
      }
    }

    return json({
      success: failed === 0,
      mode,
      timezone: TIME_ZONE,
      tanggal_jakarta: today,
      jumlah_jadwal_cocok: candidates.length,
      sent,
      failed,
      skipped,
      results,
      max_attempts: MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error("Kesalahan pengingat jadwal:", error);
    return json({
      error: "Terjadi kesalahan internal.",
    }, 500);
  }
});
