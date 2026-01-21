-- SUPABASE SCHEMA FOR SYNAPSE (SENTARI)
-- This file defines the Postgres tables, RLS policies, and triggers for the Supabase (Platform) layer.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. USERS (Extends Supabase Auth)
-- Note: Supabase manages the 'auth.users' table. We create a 'public.profiles' table to hold custom user data.
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  name text,
  bio text default 'Attuning identity...',
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.users
  for select using (true);

create policy "Users can update their own profile." on public.users
  for update using (auth.uid() = id);

-- 3. FOUNDING CIRCLE
create table public.founding_circle (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  queue_number serial,
  access_code text,
  status text check (status in ('pending', 'approved', 'activated')) default 'pending',
  signed_up_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approved_at timestamp with time zone,
  activated_at timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  user_id uuid references public.users(id)
);

alter table public.founding_circle enable row level security;

create policy "Admins can view all founding circle data." on public.founding_circle
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Users can view their own founding circle status." on public.founding_circle
  for select using (auth.email() = email);

-- 4. WAITLIST
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  full_name text,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

alter table public.waitlist enable row level security;

create policy "Admins can view waitlist." on public.waitlist
  for select using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- 5. FUNCTION: Sync Auth Users to Public Users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, username, name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
