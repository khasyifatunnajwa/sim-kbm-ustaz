/*
# Clean up duplicate admin_notifications INSERT policies

1. Security Changes
   - Remove the redundant `insert_own_notification` policy on `admin_notifications`.
   - Keep `authenticated_insert_notifications` which allows any authenticated
     user to insert (WITH CHECK (true)) — this is the correct policy for allowing
     ustaz to send notifications to admin.
   - The `insert_own_notification` policy is redundant and can cause confusion.

2. Important Notes
   - No data is affected; only a duplicate policy is dropped.
   - Idempotent: uses DROP IF EXISTS.
*/

DROP POLICY IF EXISTS "insert_own_notification" ON admin_notifications;