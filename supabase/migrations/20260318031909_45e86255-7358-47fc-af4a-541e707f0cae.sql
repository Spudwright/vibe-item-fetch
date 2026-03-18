-- Create scan_logs table to track all barcode scans
CREATE TABLE public.scan_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  barcode text NOT NULL,
  product_title text,
  product_brand text,
  product_category text,
  product_size text,
  crv_eligible boolean NOT NULL DEFAULT false,
  scanned_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Users can insert their own scan logs
CREATE POLICY "Users can insert own scan logs"
  ON public.scan_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view their own scan logs
CREATE POLICY "Users can view own scan logs"
  ON public.scan_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Allow anonymous scans (no user_id) to be inserted
CREATE POLICY "Allow anonymous scan inserts"
  ON public.scan_logs FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Enable realtime for admin monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;