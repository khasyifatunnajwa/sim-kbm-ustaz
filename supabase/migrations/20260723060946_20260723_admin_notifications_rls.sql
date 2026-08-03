/*
# Admin Notifications RLS Policies

1. Purpose
   Secures the admin_notifications table so only admins can read all notifications
   while any authenticated ustaz can insert notifications addressed to admins.

2. Changes
   - Enables RLS on admin_notifications (idempotent)
   - SELECT policy: admin users see all rows; creators see their own rows
   - INSERT policy: any authenticated user may insert (ustaz notifying admin)
   - No UPDATE/DELETE policies (notifications are append-only for now)

3. Notes
   - Uses DROP IF EXISTS before CREATE to ensure idempotency
   - Role check uses profiles.role = 'admin' (singular column, confirmed schema)
   - created_by is set by the frontend to auth.uid() on every insert
*/

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_read_all_notifications" ON admin_notifications;
CREATE POLICY "admin_read_all_notifications" ON admin_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR auth.uid() = created_by
);

DROP POLICY IF EXISTS "authenticated_insert_notifications" ON admin_notifications;
CREATE POLICY "authenticated_insert_notifications" ON admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);
