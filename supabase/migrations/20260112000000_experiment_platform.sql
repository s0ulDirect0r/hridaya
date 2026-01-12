-- Hridaya Database Schema: Experiment Platform
-- Replaces brahmavihara progression with experiment-based contemplative research

-- Drop old schema
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user cascade;
drop table if exists public.journal cascade;
drop table if exists public.profiles cascade;

-- Experiments table
create table public.experiments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,

  -- Core experiment definition
  title text not null,
  hypothesis text not null,
  protocol text not null,

  -- Metrics to track (array of {id, name, description?, scale})
  metrics jsonb not null default '[]',

  -- Duration
  duration_days integer not null check (duration_days > 0),
  start_date date not null,
  end_date date generated always as (start_date + (duration_days - 1) * interval '1 day')::date stored,

  -- Status
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),

  -- Conclusion (filled on completion)
  conclusion text,

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Log entries table
create table public.log_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  experiment_id uuid references public.experiments on delete cascade not null,

  entry_type text not null check (entry_type in ('before_sit', 'after_sit', 'eod')),
  entry_date date not null,

  -- Ratings keyed by metric id
  ratings jsonb not null default '{}',

  -- Qualitative notes
  notes text,

  -- Sit-specific fields (null for eod)
  sit_duration_minutes integer,
  technique_notes text,

  created_at timestamptz default now() not null
);

-- Minimal profiles (just onboarding state)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  onboarded_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.experiments enable row level security;
alter table public.log_entries enable row level security;
alter table public.profiles enable row level security;

-- RLS Policies: experiments
create policy "Users can view own experiments"
  on public.experiments for select using (auth.uid() = user_id);
create policy "Users can insert own experiments"
  on public.experiments for insert with check (auth.uid() = user_id);
create policy "Users can update own experiments"
  on public.experiments for update using (auth.uid() = user_id);
create policy "Users can delete own experiments"
  on public.experiments for delete using (auth.uid() = user_id);

-- RLS Policies: log_entries
create policy "Users can view own log entries"
  on public.log_entries for select using (auth.uid() = user_id);
create policy "Users can insert own log entries"
  on public.log_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own log entries"
  on public.log_entries for update using (auth.uid() = user_id);
create policy "Users can delete own log entries"
  on public.log_entries for delete using (auth.uid() = user_id);

-- RLS Policies: profiles
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes
create index experiments_user_status_idx on public.experiments(user_id, status);
create index log_entries_experiment_date_idx on public.log_entries(experiment_id, entry_date desc);
create index log_entries_user_date_idx on public.log_entries(user_id, entry_date desc);
