-- Online features for Sunny Spoon: leaderboard, cloud save and recovery codes.
--
-- The game never touches these tables directly: RLS is on with no policies, and
-- every call goes through the SECURITY DEFINER functions below (called as
-- /rest/v1/rpc/<name> with the project's publishable key). A player is
-- identified by a random device token that only ever reaches the database as a
-- SHA-256 hash; a recovery code links another device's token to the same player.

create table public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level int not null default 1,
  total_served bigint not null default 0,
  -- The client's own running total at the last accepted report, so scores only grow by the difference.
  client_served bigint,
  last_submit timestamptz,
  recovery_hash text unique,
  save jsonb,
  save_at bigint,
  created_at timestamptz not null default now()
);
create index players_total on public.players (total_served desc);
create index players_level on public.players (level desc);

create table public.devices (
  token_hash text primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index devices_player on public.devices (player_id);

create table public.weekly (
  player_id uuid not null references public.players (id) on delete cascade,
  week_start date not null,
  served int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (player_id, week_start)
);
create index weekly_board on public.weekly (week_start, served desc);

alter table public.players enable row level security;
alter table public.devices enable row level security;
alter table public.weekly enable row level security;

-- ------------------------------------------------------------------ helpers (not callable by clients)

create function public.hash_token(p_token text) returns text
language sql immutable set search_path = '' as $$
  select encode(extensions.digest(p_token, 'sha256'), 'hex')
$$;

create function public.player_of(p_token text) returns uuid
language sql stable set search_path = '' as $$
  select player_id from public.devices where token_hash = public.hash_token(p_token)
$$;

create function public.week_start() returns date
language sql stable set search_path = '' as $$
  select (date_trunc('week', now() at time zone 'utc'))::date
$$;

create function public.norm_code(p_code text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'))
$$;

create function public.clean_name(p_name text) returns text
language plpgsql immutable set search_path = '' as $$
declare
  n text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
begin
  if char_length(n) < 1 or char_length(n) > 16 then
    raise exception 'Names must be 1 to 16 characters.' using errcode = '22023';
  end if;
  if n ~ '[[:cntrl:]<>]' then
    raise exception 'Names cannot contain < or >.' using errcode = '22023';
  end if;
  return n;
end
$$;

-- ------------------------------------------------------------------ API

create function public.register(p_token text, p_name text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_id uuid;
begin
  if p_token is null or char_length(p_token) not between 32 and 128 then
    raise exception 'invalid token' using errcode = '22023';
  end if;
  v_name := public.clean_name(p_name);
  v_id := public.player_of(p_token);
  if v_id is null then
    insert into public.players (name) values (v_name) returning id into v_id;
    insert into public.devices (token_hash, player_id) values (public.hash_token(p_token), v_id);
  else
    update public.players set name = v_name where id = v_id;
  end if;
  return json_build_object('name', v_name);
end
$$;

-- Report the client's running total of customers served. Each report may only
-- add a few customers plus one per 8 seconds since the last one, which keeps a
-- tampered client from posting huge scores.
create function public.submit_score(p_token text, p_served bigint, p_level int) returns json
language plpgsql security definer set search_path = '' as $$
declare
  p public.players;
  v_delta bigint := 0;
  v_base bigint;
  v_level int;
  v_wk date := public.week_start();
begin
  select * into p from public.players where id = public.player_of(p_token) for update;
  if not found then raise exception 'unknown player' using errcode = 'P0002'; end if;
  if p_served is null or p_served < 0 or p_served > 10000000 then
    raise exception 'invalid score' using errcode = '22023';
  end if;
  if p.last_submit is not null and now() - p.last_submit < interval '3 seconds' then
    return json_build_object('accepted', 0, 'throttled', true);
  end if;

  v_base := coalesce(p.client_served, 0);
  if p_served >= v_base then
    v_delta := least(p_served - v_base,
                     3 + floor(extract(epoch from now() - coalesce(p.last_submit, p.created_at)) / 8));
    v_base := v_base + v_delta;
  else
    -- A fresh save on this device: start counting from its total.
    v_base := p_served;
  end if;

  v_level := least(greatest(coalesce(p_level, 1), 1), 999);
  v_level := greatest(p.level, least(v_level, p.level + v_delta::int));

  update public.players
  set client_served = v_base, last_submit = now(), total_served = total_served + v_delta, level = v_level
  where id = p.id;

  if v_delta > 0 then
    insert into public.weekly (player_id, week_start, served) values (p.id, v_wk, v_delta)
    on conflict (player_id, week_start)
    do update set served = public.weekly.served + excluded.served, updated_at = now();
  end if;
  return json_build_object('accepted', v_delta, 'level', v_level);
end
$$;

-- Top 50 for 'week' / 'all' (customers served) or 'level', plus the caller's own rank.
create function public.leaderboard(p_token text, p_period text default 'week') returns json
language plpgsql stable security definer set search_path = '' as $$
declare
  v_wk date := public.week_start();
  v_me uuid;
  v_top json;
  v_mine json;
begin
  if p_token is not null then v_me := public.player_of(p_token); end if;
  if p_period = 'level' then
    select json_agg(r) into v_top from (
      select rank() over (order by level desc) as rank, name, level as score, level, total_served as served,
             coalesce(id = v_me, false) as me
      from public.players where total_served > 0
      order by level desc, total_served desc, created_at limit 50
    ) r;
    select json_build_object(
      'rank', case when p.total_served > 0 then (select count(*) + 1 from public.players o where o.total_served > 0 and o.level > p.level) end,
      'score', p.level, 'name', p.name)
    into v_mine from public.players p where p.id = v_me;
  elsif p_period = 'all' then
    select json_agg(r) into v_top from (
      select rank() over (order by total_served desc) as rank, name, total_served as score, level, total_served as served,
             coalesce(id = v_me, false) as me
      from public.players where total_served > 0
      order by total_served desc, created_at limit 50
    ) r;
    select json_build_object(
      'rank', case when p.total_served > 0 then (select count(*) + 1 from public.players o where o.total_served > p.total_served) end,
      'score', p.total_served, 'name', p.name)
    into v_mine from public.players p where p.id = v_me;
  else
    select json_agg(r) into v_top from (
      select rank() over (order by w.served desc) as rank, p.name, w.served as score, p.level, p.total_served as served,
             coalesce(p.id = v_me, false) as me
      from public.weekly w join public.players p on p.id = w.player_id
      where w.week_start = v_wk and w.served > 0
      order by w.served desc, w.updated_at limit 50
    ) r;
    select json_build_object(
      'rank', case when w.served > 0 then (select count(*) + 1 from public.weekly o where o.week_start = v_wk and o.served > w.served) end,
      'score', coalesce(w.served, 0), 'name', p.name)
    into v_mine
    from public.players p
    left join public.weekly w on w.player_id = p.id and w.week_start = v_wk
    where p.id = v_me;
  end if;
  return json_build_object('period', p_period, 'week_start', v_wk, 'top', coalesce(v_top, '[]'::json), 'me', v_mine);
end
$$;

-- Keep the newest save only (by the client's own save time).
create function public.cloud_save(p_token text, p_save jsonb, p_save_at bigint) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  if p_save is null or pg_column_size(p_save) > 262144 then
    raise exception 'save too large' using errcode = '22023';
  end if;
  update public.players set save = p_save, save_at = p_save_at
  where id = v_id and (save_at is null or save_at <= p_save_at);
  return json_build_object('ok', true);
end
$$;

create function public.cloud_load(p_token text) returns json
language sql stable security definer set search_path = '' as $$
  select json_build_object('save', save, 'save_at', save_at)
  from public.players where id = public.player_of(p_token)
$$;

-- Make a new recovery code (16 characters, no 0/O or 1/I); the old one stops working.
create function public.new_code(p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := public.player_of(p_token);
  v_alpha text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_raw text := '';
  v_bytes bytea := extensions.gen_random_bytes(16);
begin
  if v_id is null then raise exception 'unknown player' using errcode = 'P0002'; end if;
  for i in 0..15 loop
    v_raw := v_raw || substr(v_alpha, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  update public.players set recovery_hash = public.hash_token(v_raw) where id = v_id;
  return json_build_object('code', substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4) || '-' || substr(v_raw, 9, 4) || '-' || substr(v_raw, 13, 4));
end
$$;

-- Link this device's token to the player that owns the code.
create function public.recover(p_code text, p_token text) returns json
language plpgsql security definer set search_path = '' as $$
declare
  p public.players;
begin
  if p_token is null or char_length(p_token) not between 32 and 128 then
    raise exception 'invalid token' using errcode = '22023';
  end if;
  select * into p from public.players where recovery_hash = public.hash_token(public.norm_code(p_code));
  if not found then raise exception 'Recovery code not found' using errcode = 'P0002'; end if;
  insert into public.devices (token_hash, player_id) values (public.hash_token(p_token), p.id)
  on conflict (token_hash) do update set player_id = excluded.player_id;
  return json_build_object('name', p.name, 'save', p.save, 'save_at', p.save_at);
end
$$;

-- Only the API functions are callable from the browser.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.register(text, text),
  public.submit_score(text, bigint, int),
  public.leaderboard(text, text),
  public.cloud_save(text, jsonb, bigint),
  public.cloud_load(text),
  public.new_code(text),
  public.recover(text, text)
to anon, authenticated;
