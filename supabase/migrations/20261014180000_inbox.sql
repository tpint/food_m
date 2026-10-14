-- Inbox: messages from the game team, with optional rewards to claim.
--
-- A message goes to one player (player_id) or to everyone (player_id null).
-- A message to everyone is a single row however many players there are; it
-- shows to players who joined before it was sent, not to later ones. Messages
-- never expire. mail_claims records what each player has read and claimed, so
-- a reward can be claimed once per player, from any of their devices.
--
-- Send one from the SQL editor with public.send_mail(...) (see below). Like the
-- other tables, these are closed to the browser; the game only calls
-- list_mail, read_mail and claim_mail.

create table public.mail (
  id bigint generated always as identity primary key,
  -- null: everyone who joined before send_at.
  player_id uuid references public.players (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  body text not null default '' check (char_length(body) <= 1000),
  coins int not null default 0 check (coins between 0 and 1000000),
  gems int not null default 0 check (gems between 0 and 100000),
  energy int not null default 0 check (energy between 0 and 100000),
  -- Board items, e.g. [{"chain": "dessert", "level": 3}].
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 20),
  -- When it shows up; set it in the future to schedule a message.
  send_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index mail_everyone on public.mail (send_at) where player_id is null;
create index mail_player on public.mail (player_id, send_at) where player_id is not null;

create table public.mail_claims (
  player_id uuid not null references public.players (id) on delete cascade,
  mail_id bigint not null references public.mail (id) on delete cascade,
  read_at timestamptz,
  claimed_at timestamptz,
  primary key (player_id, mail_id)
);

alter table public.mail enable row level security;
alter table public.mail_claims enable row level security;
revoke all on public.mail, public.mail_claims from anon, authenticated;

-- ------------------------------------------------------------------ helpers (not callable by clients)

-- Messages this player can see right now.
create function public.mail_for(p_player uuid) returns setof public.mail
language sql stable set search_path = '' as $$
  select m.* from public.mail m
  where m.send_at <= now()
    and (m.player_id = p_player
         or (m.player_id is null and m.send_at >= (select created_at from public.players where id = p_player)))
$$;

-- Send a message. p_player_name picks one player by their current name (it must
-- match exactly one); leave it null to send to everyone. For example:
--   select public.send_mail('Sorry for the downtime', 'Here is a little something.', p_gems => 50,
--                           p_items => '[{"chain": "dessert", "level": 3}]');
create function public.send_mail(
  p_title text, p_body text default '', p_coins int default 0, p_gems int default 0, p_energy int default 0,
  p_items jsonb default '[]', p_player_name text default null, p_send_at timestamptz default now()
) returns bigint
language plpgsql set search_path = '' as $$
declare
  v_player uuid;
  v_n int;
  v_id bigint;
begin
  if p_player_name is not null then
    select count(*), min(id::text)::uuid into v_n, v_player from public.players where name = p_player_name;
    if v_n <> 1 then
      raise exception '% players are named %', v_n, p_player_name;
    end if;
  end if;
  insert into public.mail (player_id, title, body, coins, gems, energy, items, send_at)
  values (v_player, p_title, coalesce(p_body, ''), p_coins, p_gems, p_energy, coalesce(p_items, '[]'), p_send_at)
  returning id into v_id;
  return v_id;
end
$$;

-- ------------------------------------------------------------------ API

-- Unclaimed messages, plus ones read or claimed in the last 30 days; newest first, at most 100.
create function public.list_mail(p_token text) returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  return coalesce((
    select json_agg(r) from (
      select m.id, m.title, m.body, m.coins, m.gems, m.energy, m.items,
             (extract(epoch from m.send_at) * 1000)::bigint as sent,
             c.read_at is not null as read, c.claimed_at is not null as claimed
      from public.mail_for(v_id) m
      left join public.mail_claims c on c.player_id = v_id and c.mail_id = m.id
      where coalesce(c.claimed_at, c.read_at) is null
         or coalesce(c.claimed_at, c.read_at) > now() - interval '30 days'
      order by m.send_at desc, m.id desc
      limit 100
    ) r
  ), '[]'::json);
end
$$;

-- Mark messages as read (used for messages without rewards).
create function public.read_mail(p_token text, p_ids bigint[]) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  insert into public.mail_claims (player_id, mail_id, read_at)
  select v_id, m.id, now() from public.mail_for(v_id) m where m.id = any (p_ids[1:100])
  on conflict (player_id, mail_id) do update set read_at = coalesce(public.mail_claims.read_at, excluded.read_at);
  return json_build_object('ok', true);
end
$$;

-- Claim a message's rewards, once. Returns them for the game to hand out.
create function public.claim_mail(p_token text, p_mail_id bigint) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
  m public.mail;
  v_claimed timestamptz;
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  select * into m from public.mail_for(v_id) x where x.id = p_mail_id;
  if not found then raise exception 'Message not found' using errcode = 'P0002'; end if;
  insert into public.mail_claims (player_id, mail_id, read_at, claimed_at)
  values (v_id, m.id, now(), now())
  on conflict (player_id, mail_id) do update set claimed_at = now(), read_at = coalesce(public.mail_claims.read_at, now())
    where public.mail_claims.claimed_at is null
  returning claimed_at into v_claimed;
  if v_claimed is null then raise exception 'Already claimed' using errcode = '23505'; end if;
  return json_build_object('coins', m.coins, 'gems', m.gems, 'energy', m.energy, 'items', m.items);
end
$$;

revoke execute on function public.mail_for(uuid), public.send_mail(text, text, int, int, int, jsonb, text, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.list_mail(text), public.read_mail(text, bigint[]), public.claim_mail(text, bigint)
  from public;
grant execute on function public.list_mail(text), public.read_mail(text, bigint[]), public.claim_mail(text, bigint)
  to anon, authenticated;
