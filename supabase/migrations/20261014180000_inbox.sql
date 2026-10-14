-- Inbox: messages from the server to players, optionally with a reward.
--
-- A message with no player_id goes to everyone. Send one from the SQL editor:
--
--   insert into public.inbox_messages (title, body, gems, coins, energy)
--   values ('Thanks for playing!', 'Here is a little something.', 10, 100, 0);
--
-- or to one player with player_id set (see public.players). Like the other
-- tables, the browser can't read these directly: it goes through the
-- SECURITY DEFINER functions below with the player's device token.

create table public.inbox_messages (
  id bigint generated always as identity primary key,
  -- Null: every player gets it.
  player_id uuid references public.players (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  body text not null default '' check (char_length(body) <= 2000),
  coins int not null default 0 check (coins between 0 and 100000),
  gems int not null default 0 check (gems between 0 and 10000),
  energy int not null default 0 check (energy between 0 and 10000),
  created_at timestamptz not null default now(),
  -- Gone from the inbox after this (null: never).
  expires_at timestamptz
);
create index inbox_messages_player on public.inbox_messages (player_id, created_at desc);

create table public.inbox_state (
  player_id uuid not null references public.players (id) on delete cascade,
  message_id bigint not null references public.inbox_messages (id) on delete cascade,
  read_at timestamptz,
  claimed_at timestamptz,
  primary key (player_id, message_id)
);

alter table public.inbox_messages enable row level security;
alter table public.inbox_state enable row level security;

-- The 50 newest live messages for this player, with whether each was read or claimed.
create function public.inbox(p_token text) returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
  v_rows json;
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  select json_agg(r) into v_rows from (
    select m.id, m.title, m.body, m.coins, m.gems, m.energy,
           (extract(epoch from m.created_at) * 1000)::bigint as sent_at,
           s.read_at is not null as read,
           s.claimed_at is not null as claimed
    from public.inbox_messages m
    left join public.inbox_state s on s.message_id = m.id and s.player_id = v_id
    where (m.player_id is null or m.player_id = v_id)
      and (m.expires_at is null or m.expires_at > now())
    order by m.created_at desc, m.id desc
    limit 50
  ) r;
  return coalesce(v_rows, '[]'::json);
end
$$;

create function public.inbox_message_for(p_player uuid, p_id bigint) returns public.inbox_messages
language sql stable set search_path = '' as $$
  select * from public.inbox_messages
  where id = p_id and (player_id is null or player_id = p_player) and (expires_at is null or expires_at > now())
$$;

create function public.inbox_read(p_token text, p_id bigint) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  if (public.inbox_message_for(v_id, p_id)).id is null then
    raise exception 'Message not found' using errcode = 'P0002';
  end if;
  insert into public.inbox_state (player_id, message_id, read_at) values (v_id, p_id, now())
  on conflict (player_id, message_id) do update set read_at = coalesce(public.inbox_state.read_at, now());
  return json_build_object('ok', true);
end
$$;

-- Claim a message's reward once. Returns what to add to the save; the second
-- claim is refused so a reward can't be collected twice.
create function public.inbox_claim(p_token text, p_id bigint) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
  m public.inbox_messages;
  v_new boolean;
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  m := public.inbox_message_for(v_id, p_id);
  if m.id is null then raise exception 'Message not found' using errcode = 'P0002'; end if;
  insert into public.inbox_state (player_id, message_id, read_at, claimed_at) values (v_id, p_id, now(), now())
  on conflict (player_id, message_id) do update
    set claimed_at = now(), read_at = coalesce(public.inbox_state.read_at, now())
    where public.inbox_state.claimed_at is null
  returning true into v_new;
  if v_new is null then raise exception 'Already claimed' using errcode = '23505'; end if;
  return json_build_object('coins', m.coins, 'gems', m.gems, 'energy', m.energy);
end
$$;

revoke execute on function public.inbox(text), public.inbox_message_for(uuid, bigint),
  public.inbox_read(text, bigint), public.inbox_claim(text, bigint) from public, anon, authenticated;
grant execute on function public.inbox(text), public.inbox_read(text, bigint), public.inbox_claim(text, bigint)
to anon, authenticated;
revoke all on public.inbox_messages, public.inbox_state from anon, authenticated;

-- A first message for everyone, so the inbox isn't empty.
insert into public.inbox_messages (title, body, gems, coins)
values ('Welcome to your inbox!', 'News and gifts from the Sunny Spoon team will arrive here. Here is a small gift to get you started.', 10, 100);
