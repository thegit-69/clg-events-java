-- V3 Migration: Ensure ON UPDATE CASCADE on all user foreign keys
-- and clean up dummy seed admin user so real Neon Auth user ID can be safely mapped.

DO $$
BEGIN
  -- 1. Events organizer_id
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'events_organizer_id_fkey') THEN
    ALTER TABLE events DROP CONSTRAINT events_organizer_id_fkey;
  END IF;
  ALTER TABLE events ADD CONSTRAINT events_organizer_id_fkey 
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

  -- 2. Events reviewed_by
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'events_reviewed_by_fkey') THEN
    ALTER TABLE events DROP CONSTRAINT events_reviewed_by_fkey;
  END IF;
  ALTER TABLE events ADD CONSTRAINT events_reviewed_by_fkey 
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

  -- 3. Registrations user_id
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'registrations_user_id_fkey') THEN
    ALTER TABLE registrations DROP CONSTRAINT registrations_user_id_fkey;
  END IF;
  ALTER TABLE registrations ADD CONSTRAINT registrations_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;

  -- 4. Notifications user_id
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_fkey') THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_user_id_fkey;
  END IF;
  ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
END $$;

-- 5. Delete legacy placeholder admin user if it has no created events or registrations
DELETE FROM users 
WHERE id = 'usr_admin_001' 
  AND NOT EXISTS (SELECT 1 FROM events WHERE organizer_id = 'usr_admin_001')
  AND NOT EXISTS (SELECT 1 FROM registrations WHERE user_id = 'usr_admin_001');
