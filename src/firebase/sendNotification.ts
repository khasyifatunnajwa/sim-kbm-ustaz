// @ts-nocheck — This file is intended for Deno (Supabase Edge Functions), not the browser bundle.
/**
 * sendNotification — helper to send a push notification via Firebase Cloud
 * Messaging from a Supabase Edge Function (Deno).
 *
 * Usage in an edge function:
 *   import { sendNotification } from './sendNotification.ts';
 *   await sendNotification(supabaseClient, userId, { title, body, url });
 *
 * It looks up all device_tokens for the user in Supabase and calls the FCM
 * HTTP v1 API using the project's OAuth access token (server-to-server).
 *
 * NOTE: This file is intended to be copied into an edge function directory
 * (e.g. supabase/functions/send-push/index.ts) — it is NOT imported by the
 * browser bundle. It uses Deno / node: APIs and is typed for the Deno runtime.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

export interface SendResult {
  success: number;
  failure: number;
}

/**
 * Send a push notification to every device token owned by `userId`.
 * `accessToken` is a Firebase OAuth2 access token with messaging scope.
 */
export async function sendNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  payload: NotificationPayload,
  accessToken: string
): Promise<SendResult> {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: tokens, error } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error) throw error;
  if (!tokens || tokens.length === 0) return { success: 0, failure: 0 };

  const projectId = 'sim-kbm-ustaz';
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  let success = 0;
  let failure = 0;

  for (const row of tokens) {
    const message = {
      message: {
        token: row.token,
        notification: { title: payload.title, body: payload.body },
        data: { url: payload.url ?? '/', ...(payload.data ?? {}) },
        android: { notification: { icon: '/icon/192x192.png' } },
        webpush: {
          notification: {
            icon: '/icon/192x192.png',
            badge: '/icon/192x192.png',
          },
        },
      },
    };

    try {
      const resp = await fetch(fcmUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
      if (resp.ok) success++;
      else failure++;
    } catch {
      failure++;
    }
  }

  return { success, failure };
}
