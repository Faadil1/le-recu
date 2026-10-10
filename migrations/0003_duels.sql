-- No client-provided choice may be read from a shareable URL.
-- In production, connect durable PostgreSQL through DATABASE_URL.
create table if not exists duels (
  id text primary key,
  desire text not null,
  seed bigint not null,
  created_at_ms bigint not null,
  expires_at_ms bigint not null,
  creator_line smallint not null check (creator_line between 0 and 4),
  creator_token text not null,
  responder_line smallint check (responder_line between 0 and 4),
  responder_token text,
  responded_at_ms bigint,
  constraint duels_reply_pair check (
    (responder_line is null and responder_token is null and responded_at_ms is null)
    or (responder_line is not null and responder_token is not null and responded_at_ms is not null)
  )
);
create index if not exists duels_expiration_idx on duels (expires_at_ms);
