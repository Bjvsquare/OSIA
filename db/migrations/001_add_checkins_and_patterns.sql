-- Migration: Add check_ins and patterns tables
-- This migration adds tables for the visual-first check-in MVP

-- 1. CHECK-INS TABLE (daily check-in data)
create table if not exists public.check_ins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  emotion text not null check (emotion in ('Energized', 'Stressed', 'Curious', 'Grounded', 'Flowing', 'Stuck', 'Overwhelmed', 'Reflective')),
  energy_level integer not null check (energy_level >= 0 and energy_level <= 100),
  context text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for common queries
create index if not exists idx_check_ins_user_created on public.check_ins(user_id, created_at desc);
create index if not exists idx_check_ins_emotion on public.check_ins(user_id, emotion);

-- Enable RLS
alter table public.check_ins enable row level security;

-- RLS Policies
create policy "Users can view their own check-ins" on public.check_ins
  for select using (auth.uid() = user_id);

create policy "Users can insert their own check-ins" on public.check_ins
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own check-ins" on public.check_ins
  for update using (auth.uid() = user_id);

-- 2. PATTERNS TABLE (detected patterns from check-ins)
create table if not exists public.patterns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  confidence float not null check (confidence >= 0 and confidence <= 1),
  emotion_sequence text[], -- e.g., ['Stressed', 'Rest']
  frequency integer, -- how many times detected
  first_detected_at timestamp with time zone default timezone('utc'::text, now()),
  last_detected_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes
create index if not exists idx_patterns_user_confidence on public.patterns(user_id, confidence desc);
create index if not exists idx_patterns_user_detected on public.patterns(user_id, last_detected_at desc);

-- Enable RLS
alter table public.patterns enable row level security;

-- RLS Policies
create policy "Users can view their own patterns" on public.patterns
  for select using (auth.uid() = user_id);

-- 3. FUNCTION: Auto-update updated_at on check_ins
create or replace function public.update_check_in_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger
create trigger update_check_ins_timestamp
  before update on public.check_ins
  for each row
  execute function public.update_check_in_timestamp();

-- 4. FUNCTION: Check check-in daily limit (optional: max 1 per day)
create or replace function public.check_daily_checkin_limit(user_id_input uuid)
returns boolean as $$
declare
  checkin_count integer;
begin
  select count(*)
  into checkin_count
  from public.check_ins
  where user_id = user_id_input
  and created_at > timezone('utc'::text, now()) - interval '24 hours';

  return checkin_count < 10; -- Allow multiple check-ins per day
end;
$$ language plpgsql;
