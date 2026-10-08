create table if not exists strikes (
  id serial primary key,
  day integer not null,
  desire text not null,
  line smallint not null check (line >= 0 and line <= 4),
  token text not null,
  created_at timestamptz not null default now(),
  unique (day, desire, token)
);

create index if not exists strikes_day_desire_idx on strikes (day, desire);
