-- Stage 1: one record per completed challenge, keyed by a SHA-256 hash of a
-- random browser-owned 256-bit bearer token. The token itself is never stored.
create table if not exists public.challenges (
 id uuid primary key,
 player_id text not null check (player_id ~ '^[a-f0-9]{64}$'),
 attempts integer not null check (attempts between 1 and 10000),
 successful_time_seconds double precision not null check (successful_time_seconds between 12 and 3600),
 score integer not null check (score between 0 and 10000),
 completed_at timestamptz not null default now()
);
create index if not exists challenges_player_recent on public.challenges (player_id, completed_at desc);
create index if not exists challenges_player_best on public.challenges (player_id, score desc);
alter table public.challenges enable row level security;
-- No policies: browser/anon clients cannot directly access records.
-- The Vercel serverless API uses the service-role key stored in server secrets.
revoke all on public.challenges from anon, authenticated;
