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
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_robot_webhook_events_dedup
  ON public.robot_webhook_events (job_id, trigger, ((payload->'data'->>'completion_time')));

CREATE INDEX IF NOT EXISTS idx_robot_webhook_events_pickup_id ON public.robot_webhook_events(pickup_id);
CREATE INDEX IF NOT EXISTS idx_robot_webhook_events_job_id ON public.robot_webhook_events(job_id);

ALTER TABLE public.robot_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view webhook events"
ON public.robot_webhook_events FOR SELECT
USING (public.is_admin());