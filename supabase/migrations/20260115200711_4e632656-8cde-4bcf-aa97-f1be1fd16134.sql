-- Add gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS total_points integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_xp integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_items_recycled integer NOT NULL DEFAULT 0;

-- Add points_earned to pickups for tracking
ALTER TABLE public.pickups
ADD COLUMN IF NOT EXISTS points_earned integer DEFAULT 0;