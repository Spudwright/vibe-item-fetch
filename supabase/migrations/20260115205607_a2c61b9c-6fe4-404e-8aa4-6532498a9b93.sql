-- Create donation organizations table
CREATE TABLE public.donation_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('school', 'shelter', 'hospital', 'other')),
  description TEXT,
  logo_url TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create donations history table
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.donation_organizations(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donation_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Organizations are publicly viewable (active ones)
CREATE POLICY "Anyone can view active organizations"
ON public.donation_organizations
FOR SELECT
USING (is_active = true);

-- Admin can manage organizations
CREATE POLICY "Admin can manage organizations"
ON public.donation_organizations
FOR ALL
USING (is_admin());

-- Users can view their own donations
CREATE POLICY "Users can view own donations"
ON public.donations
FOR SELECT
USING (user_id = auth.uid());

-- Users can create donations
CREATE POLICY "Users can create donations"
ON public.donations
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Insert some sample organizations
INSERT INTO public.donation_organizations (name, type, description, address) VALUES
  ('Lincoln Elementary School', 'school', 'Supporting environmental education programs for K-5 students', '123 Education Way, Oakland, CA'),
  ('Bay Area Community Shelter', 'shelter', 'Providing housing and support for families in need', '456 Hope Street, San Francisco, CA'),
  ('Children''s Hospital Oakland', 'hospital', 'Funding pediatric care and medical research', '789 Health Ave, Oakland, CA'),
  ('Green Valley High School', 'school', 'Funding recycling and sustainability initiatives', '321 Academic Blvd, Berkeley, CA'),
  ('Harbor House Shelter', 'shelter', 'Emergency shelter and meal programs', '555 Harbor Road, Alameda, CA');