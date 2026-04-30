-- Robot.com (Kiwibot) Jobs API integration — Phase 1
-- Adds Robot.com tracking columns to pickups + a webhook event log table.
-- robot_status is a free-form TEXT column with the lifecycle states from the
-- Robot.com webhook (pending | created | assigned | en_route | at_pickup |
-- loaded | en_route_dropoff | at_dropoff | delivered | cancelled | failed)
-- and is intentionally separate from the existing pickup_status enum, which
-- the rest of the app continues to use.

ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_job_id TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_status TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_bot_id TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_tracker_url TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_dispatched_at TIMESTAMPTZ;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_completed_at TIMESTAMPTZ;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_door_status TEXT;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_last_lat DOUBLE PRECISION;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_last_lng DOUBLE PRECISION;
ALTER TABLE public.pickups ADD COLUMN IF NOT EXISTS robot_battery INTEGER;

CREATE INDEX IF NOT EXISTS idx_pickups_robot_job_id ON public.pickups(robot_job_id);

-- Webhook event log. Idempotency guard: same (job_id, trigger, completion_time)
-- tuple is rejected by the unique constraint, letting us safely accept
-- Robot.com retries.
CREATE TABLE IF NOT EXISTS public.robot_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_id UUID REFERENCES public.pickups(id) ON DELETE SET NULL,
  job_id TEXT NOT NULL,
  trigger TEXT NOT NULL,
  step_type TEXT,
  next_success_step_type TEXT,
  point_id TEXT,
  point_name TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, trigger, (payload->'data'->>'completion_time'))
);

CREATE INDEX IF NOT EXISTS idx_robot_webhook_events_pickup_id ON public.robot_webhook_events(pickup_id);
CREATE INDEX IF NOT EXISTS idx_robot_webhook_events_job_id ON public.robot_webhook_events(job_id);

-- RLS — webhook table is admin-only-readable. The edge function uses the
-- service-role key and bypasses RLS for inserts.
ALTER TABLE public.robot_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view webhook events"
ON public.robot_webhook_events FOR SELECT
USING (public.is_admin());
