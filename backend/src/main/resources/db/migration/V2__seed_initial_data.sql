-- V2 Initial Seed: Ensure Super Admin exists
-- Real events and organizers are created dynamically through Google login

INSERT INTO users (id, email, display_name, photo_url, role, created_at, updated_at)
VALUES 
  ('usr_admin_001', 'cdasarath2006@gmail.com', 'Dasarath C (Admin)', 'https://api.dicebear.com/7.x/bottts/svg?seed=Dasarath', 'SUPER_ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET 
  role = 'SUPER_ADMIN',
  updated_at = NOW();
