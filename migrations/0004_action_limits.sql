-- Staging/public-beta abuse budget. Atomic UPSERT counters work across all
-- Vercel instances backed by the same durable Neon branch.
-- Actor key = sha256 of pseudonymous browser token; never raw token in this table.
create table if not exists action_limits (
  scope text not null check (scope in ('duel-create', 'duel-reply', 'room-strike')),
  day integer not null,
  actor_key text not null,
  used integer not null default 0 check (used between 0 and 100000),
  updated_at timestamptz not null default now(),
  primary key (scope, day, actor_key)
);
create index if not exists action_limits_day_idx on action_limits (day);
