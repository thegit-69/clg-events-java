-- V4: Directly sync super admin user ID from seed placeholder to real Neon Auth UUID.
-- Root cause: V2 seeded 'usr_admin_001' as a placeholder; Neon Auth assigned UUID
-- 'ac7b0cc7-d04d-46dd-89ca-8b21ef716d8f' for cdasarath2006@gmail.com.
-- This migration updates all child tables first, then updates the primary key.

DO $$
DECLARE
  v_neon_id   TEXT := 'ac7b0cc7-d04d-46dd-89ca-8b21ef716d8f';
  v_admin_email TEXT := 'cdasarath2006@gmail.com';
  v_old_id    TEXT := 'usr_admin_001';
BEGIN

  -- ── Case 1: Old placeholder still exists ─────────────────────────────────
  IF EXISTS (SELECT 1 FROM users WHERE id = v_old_id) THEN

    RAISE NOTICE '[V4] Found old super admin ID %. Starting migration...', v_old_id;

    -- Update child tables BEFORE the PK (bypasses any FK constraint issues)
    UPDATE events       SET organizer_id = v_neon_id WHERE organizer_id = v_old_id;
    UPDATE events       SET reviewed_by  = v_neon_id WHERE reviewed_by  = v_old_id;
    UPDATE registrations SET user_id     = v_neon_id WHERE user_id      = v_old_id;
    UPDATE notifications SET user_id     = v_neon_id WHERE user_id      = v_old_id;

    -- Edge case: A new user row was already created for v_neon_id (e.g. by syncUserFromJwt)
    IF EXISTS (SELECT 1 FROM users WHERE id = v_neon_id) THEN
      -- Remove the duplicate placeholder; keep the already-existing Neon row
      -- and ensure it has SUPER_ADMIN role
      UPDATE users SET role = 'SUPER_ADMIN' WHERE id = v_neon_id AND email = v_admin_email;
      DELETE FROM users WHERE id = v_old_id;
      RAISE NOTICE '[V4] Neon user already existed at %. Deleted placeholder, set SUPER_ADMIN.', v_neon_id;
    ELSE
      -- Normal path: rename the placeholder PK to the real Neon UUID
      UPDATE users
        SET id           = v_neon_id,
            role         = 'SUPER_ADMIN',
            updated_at   = NOW()
        WHERE id = v_old_id;
      RAISE NOTICE '[V4] Super admin ID updated from % to %.', v_old_id, v_neon_id;
    END IF;

  -- ── Case 2: Already migrated — just ensure role is correct ───────────────
  ELSIF EXISTS (SELECT 1 FROM users WHERE id = v_neon_id AND email = v_admin_email) THEN
    UPDATE users
      SET role       = 'SUPER_ADMIN',
          updated_at = NOW()
      WHERE id    = v_neon_id
        AND email = v_admin_email;
    RAISE NOTICE '[V4] Super admin already at correct ID %. Role ensured as SUPER_ADMIN.', v_neon_id;

  ELSE
    RAISE NOTICE '[V4] No action needed: admin placeholder and neon ID both absent.';
  END IF;

END $$;
