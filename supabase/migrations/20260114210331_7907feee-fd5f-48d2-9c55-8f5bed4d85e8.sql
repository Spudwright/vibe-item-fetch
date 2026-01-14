-- Create enums for roles and statuses
CREATE TYPE public.user_role AS ENUM ('user', 'driver', 'admin');
CREATE TYPE public.drone_status AS ENUM ('idle', 'active', 'maintenance');
CREATE TYPE public.pickup_status AS ENUM ('pending', 'assigned', 'in_transit', 'completed', 'cancelled');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  crv_balance INTEGER NOT NULL DEFAULT 0,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create drones table
CREATE TABLE public.drones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status drone_status NOT NULL DEFAULT 'idle',
  lat FLOAT8,
  lng FLOAT8,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assignments table (driver -> drone)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drone_id UUID NOT NULL REFERENCES public.drones(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(drone_id, driver_id, active)
);

-- Create pickups table
CREATE TABLE public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  drone_id UUID REFERENCES public.drones(id),
  status pickup_status NOT NULL DEFAULT 'pending',
  pickup_address TEXT NOT NULL,
  pickup_lat FLOAT8,
  pickup_lng FLOAT8,
  items JSONB,
  estimated_crv INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Helper function: check if user is assigned driver for a drone
CREATE OR REPLACE FUNCTION public.is_assigned_driver(drone_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.assignments 
    WHERE drone_id = drone_uuid AND driver_id = auth.uid() AND active = true
  )
$$;

-- Helper function: check if user has active pickup for drone
CREATE OR REPLACE FUNCTION public.is_assigned_user(drone_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pickups 
    WHERE drone_id = drone_uuid AND user_id = auth.uid() AND status IN ('assigned', 'in_transit')
  )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile or admin can view all"
ON public.profiles FOR SELECT
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Drones RLS policies
CREATE POLICY "View drones if admin, assigned driver, or assigned user"
ON public.drones FOR SELECT
USING (public.is_admin() OR public.is_assigned_driver(id) OR public.is_assigned_user(id));

CREATE POLICY "Update drones if admin or assigned driver"
ON public.drones FOR UPDATE
USING (public.is_admin() OR public.is_assigned_driver(id));

CREATE POLICY "Admin can insert drones"
ON public.drones FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admin can delete drones"
ON public.drones FOR DELETE
USING (public.is_admin());

-- Assignments RLS policies
CREATE POLICY "View own assignments or admin"
ON public.assignments FOR SELECT
USING (driver_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin can manage assignments"
ON public.assignments FOR ALL
USING (public.is_admin());

-- Pickups RLS policies
CREATE POLICY "View own pickups or assigned pickups or admin"
ON public.pickups FOR SELECT
USING (
  user_id = auth.uid() 
  OR public.is_admin() 
  OR (drone_id IN (SELECT drone_id FROM public.assignments WHERE driver_id = auth.uid() AND active = true))
);

CREATE POLICY "Users can create own pickups"
ON public.pickups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update pickups with restrictions"
ON public.pickups FOR UPDATE
USING (
  user_id = auth.uid() 
  OR public.is_admin() 
  OR public.is_assigned_driver(drone_id)
);

CREATE POLICY "Admin can delete pickups"
ON public.pickups FOR DELETE
USING (public.is_admin());

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pickups_updated_at
BEFORE UPDATE ON public.pickups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for drone tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.drones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickups;

-- Create indexes for fast RLS checks
CREATE INDEX idx_assignments_driver_active ON public.assignments(driver_id, active);
CREATE INDEX idx_pickups_drone_user ON public.pickups(drone_id, user_id);
CREATE INDEX idx_pickups_user_status ON public.pickups(user_id, status);