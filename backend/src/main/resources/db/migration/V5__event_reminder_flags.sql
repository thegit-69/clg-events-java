-- Idempotency flags for scheduled event reminders.
-- Added with a default so existing rows remain valid.
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS start_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS deadline_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
