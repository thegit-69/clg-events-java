-- V1 Initial Schema for CampusEvents PostgreSQL Database (Compatible with Neon Auth)

-- 1. Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Users Table (Synchronized with Neon Auth identity)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    photo_url VARCHAR(1024),
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    venue VARCHAR(255),
    banner_url VARCHAR(1024),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_deadline TIMESTAMPTZ,
    max_participants INT NOT NULL DEFAULT 100,
    status VARCHAR(30) NOT NULL DEFAULT 'UPCOMING',
    approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reviewed_by VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Event Tags Table
CREATE TABLE IF NOT EXISTS event_tags (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag VARCHAR(100) NOT NULL,
    PRIMARY KEY (event_id, tag)
);

-- 5. Registrations Table (Unique registration per user per event, UUID used for QR ticket)
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    attended BOOLEAN NOT NULL DEFAULT FALSE,
    attended_at TIMESTAMPTZ,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_event_user UNIQUE (event_id, user_id)
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'EVENT',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
