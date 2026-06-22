create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  onboarded boolean default false,
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  audio_url text not null,
  duration_ms integer not null,
  created_at timestamptz default now()
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table echoes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  size float not null,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table profiles enable row level security;
alter table posts enable row level security;
alter table follows enable row level security;
alter table echoes enable row level security;

create policy "Public profiles" on profiles for select using (true);
create policy "Own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "Update own profile" on profiles for update using (auth.uid() = id);

create policy "Posts viewable" on posts for select using (true);
create policy "Own posts" on posts for insert with check (auth.uid() = user_id);

create policy "Follows viewable" on follows for select using (true);
create policy "Own follows insert" on follows for insert with check (auth.uid() = follower_id);
create policy "Delete own follows" on follows for delete using (auth.uid() = follower_id);

create policy "Echoes viewable" on echoes for select using (true);
create policy "Own echoes" on echoes for insert with check (auth.uid() = user_id);
