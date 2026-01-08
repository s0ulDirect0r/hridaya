-- Hridaya Database Schema

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  vow text,
  streak integer default 0,
  last_practice_date date,
  metta_stage text default 'self' check (metta_stage in ('self', 'benefactor', 'friend', 'neutral', 'difficult', 'all')),
  karuna_stage text default 'self' check (karuna_stage in ('self', 'benefactor', 'friend', 'neutral', 'difficult', 'all')),
  mudita_stage text default 'self' check (mudita_stage in ('self', 'benefactor', 'friend', 'neutral', 'difficult', 'all')),
  upekkha_stage text default 'self' check (upekkha_stage in ('self', 'benefactor', 'friend', 'neutral', 'difficult', 'all')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Journal (sessions, missed days, readiness gates - all in one table)
create table public.journal (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  entry_type text not null check (entry_type in ('session', 'missed_day', 'readiness_gate')),
  entry_date date not null,
  data jsonb not null,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.journal enable row level security;

-- RLS Policies: Users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own journal" on public.journal for select using (auth.uid() = user_id);
create policy "Users can insert own journal" on public.journal for insert with check (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Index for common query pattern
create index journal_user_date_idx on public.journal(user_id, entry_date desc);
