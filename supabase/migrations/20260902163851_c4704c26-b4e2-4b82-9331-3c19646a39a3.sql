
revoke execute on function public.protect_profile_columns() from anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from anon;

create or replace function public.get_setting(_key text)
returns jsonb language sql stable security definer set search_path = public as $$
  select value from public.economy_settings where key = _key
$$;
revoke execute on function public.get_setting(text) from anon;

create or replace function public.streak_multiplier(_streak int)
returns numeric language plpgsql stable security definer set search_path = public as $$
declare m jsonb; best numeric := 1.0; k text; v numeric;
begin
  m := public.get_setting('streak_multipliers');
  for k, v in select key, value::text::numeric from jsonb_each(m) loop
    if k::int <= greatest(_streak,1) and v > best then best := v; end if;
  end loop;
  return best;
end; $$;
revoke execute on function public.streak_multiplier(int) from anon, authenticated;

create or replace function public.notify(_user uuid, _title text, _body text, _kind text)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (user_id,title,body,kind) values (_user,_title,_body,_kind)
$$;
revoke execute on function public.notify(uuid,text,text,text) from anon, authenticated;

create or replace function public.award_achievement(_user uuid, _code text)
returns void language plpgsql security definer set search_path = public as $$
declare a public.achievements;
begin
  select * into a from public.achievements where code = _code;
  if a.id is null then return; end if;
  insert into public.user_achievements (user_id, achievement_id) values (_user, a.id)
  on conflict do nothing;
  if found then perform public.notify(_user,'Achievement unlocked', a.title, 'ACHIEVEMENT'); end if;
end; $$;
revoke execute on function public.award_achievement(uuid,text) from anon, authenticated;

create or replace function public.credit_points(
  _user uuid, _amount bigint, _type text, _ref uuid, _idem text, _desc text, _meta jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare tx uuid; new_total bigint; new_level int; old_level int;
begin
  insert into public.points_ledger (user_id,amount,transaction_type,reference_id,idempotency_key,description,metadata)
  values (_user,_amount,_type,_ref,_idem,_desc,_meta)
  on conflict (idempotency_key) do nothing
  returning id into tx;
  if tx is null then return null; end if;

  update public.profiles set points = points + _amount, last_active_at = now()
  where user_id = _user returning points, level_number into new_total, old_level;

  select coalesce(max(level_number),1) into new_level from public.levels where required_points <= new_total;
  if new_level > old_level then
    update public.profiles set level_number = new_level where user_id = _user;
    perform public.notify(_user,'Level up!','You reached Level '||new_level||' — '||
      (select name from public.levels where level_number = new_level),'LEVEL');
  end if;
  return tx;
end; $$;
revoke execute on function public.credit_points(uuid,bigint,text,uuid,text,text,jsonb) from anon, authenticated;

-- START SESSION
create or replace function public.start_earning_session()
returns public.earning_sessions language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); p public.profiles; s public.earning_sessions; dur int; rate numeric; mult numeric;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not coalesce((select enabled from public.feature_flags where key='EARNING_ENABLED'),false) then
    raise exception 'EARNING_DISABLED';
  end if;
  select * into p from public.profiles where user_id = uid;
  if p.id is null then raise exception 'NO_PROFILE'; end if;
  if p.status <> 'ACTIVE' then raise exception 'ACCOUNT_NOT_ACTIVE'; end if;
  if exists (select 1 from public.earning_sessions where user_id = uid and status = 'ACTIVE') then
    raise exception 'SESSION_ALREADY_ACTIVE';
  end if;
  dur := (public.get_setting('session_duration_seconds'))::text::int;
  rate := (public.get_setting('base_rate_per_hour'))::text::numeric;
  mult := public.streak_multiplier(p.current_streak) * coalesce((select multiplier from public.levels where level_number = p.level_number),1);
  insert into public.earning_sessions (user_id, expected_end_at, base_rate, multiplier)
  values (uid, now() + make_interval(secs => dur), rate, mult)
  returning * into s;
  return s;
end; $$;
grant execute on function public.start_earning_session() to authenticated;
revoke execute on function public.start_earning_session() from anon;

-- COMPLETE SESSION
create or replace function public.complete_earning_session()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); s public.earning_sessions; p public.profiles;
        earned bigint; today date := (now() at time zone 'utc')::date; issued_today bigint;
        daily_max bigint; tx uuid; ref public.referrals; new_streak int;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into s from public.earning_sessions where user_id = uid and status = 'ACTIVE' for update;
  if s.id is null then raise exception 'NO_ACTIVE_SESSION'; end if;
  if now() < s.expected_end_at then raise exception 'SESSION_NOT_FINISHED'; end if;

  earned := floor(s.base_rate * s.multiplier * extract(epoch from (s.expected_end_at - s.started_at))/3600.0);
  daily_max := (public.get_setting('daily_max_points'))::text::bigint;
  select coalesce(sum(amount),0) into issued_today from public.points_ledger
   where user_id = uid and transaction_type = 'EARNING_SESSION'
     and (created_at at time zone 'utc')::date = today;
  earned := greatest(least(earned, daily_max - issued_today), 0);

  update public.earning_sessions set status='COMPLETED', ended_at = now(), points_accrued = earned where id = s.id;

  select * into p from public.profiles where user_id = uid;
  if p.last_activity_date is null or p.last_activity_date < today then
    if p.last_activity_date = today - 1 then new_streak := p.current_streak + 1; else new_streak := 1; end if;
    update public.profiles set current_streak = new_streak,
      longest_streak = greatest(longest_streak, new_streak), last_activity_date = today
      where user_id = uid;
  else
    new_streak := p.current_streak;
  end if;

  if earned > 0 then
    tx := public.credit_points(uid, earned, 'EARNING_SESSION', s.id, 'session:'||s.id::text,
      'Earning session reward', jsonb_build_object('multiplier', s.multiplier));
  end if;

  perform public.notify(uid,'Earning session complete','You earned '||earned||' SVP.','EARNING');
  perform public.award_achievement(uid,'FIRST_SESSION');
  if new_streak >= 3 then perform public.award_achievement(uid,'STREAK_3'); end if;
  if new_streak >= 7 then perform public.award_achievement(uid,'STREAK_7'); end if;
  if new_streak >= 30 then perform public.award_achievement(uid,'STREAK_30'); end if;

  -- referral qualification
  select * into ref from public.referrals r
    join public.profiles pr on pr.id = r.referred_id
   where pr.user_id = uid and r.status in ('REGISTERED','INVITED');
  if ref.id is not null then
    update public.referrals set status='REWARDED', qualified_at = now(), rewarded_at = now() where id = ref.id;
    perform public.credit_points(
      (select user_id from public.profiles where id = ref.referrer_id),
      (public.get_setting('referral_reward_points'))::text::bigint,
      'REFERRAL_REWARD', ref.id, 'referral:'||ref.id::text, 'Qualified referral reward');
    perform public.notify((select user_id from public.profiles where id = ref.referrer_id),
      'Referral qualified','One of your referrals has qualified.','REFERRAL');
    perform public.credit_points(uid,
      (public.get_setting('referral_welcome_points'))::text::bigint,
      'PROMOTIONAL_REWARD', ref.id, 'referral-welcome:'||ref.id::text, 'Referral welcome bonus');
    if (select count(*) from public.referrals where referrer_id = ref.referrer_id and status='REWARDED') = 1 then
      perform public.award_achievement((select user_id from public.profiles where id = ref.referrer_id),'FIRST_REFERRAL');
    end if;
    if (select count(*) from public.referrals where referrer_id = ref.referrer_id and status='REWARDED') >= 10 then
      perform public.award_achievement((select user_id from public.profiles where id = ref.referrer_id),'REFERRALS_10');
    end if;
  end if;

  return jsonb_build_object('earned', earned, 'streak', new_streak,
    'balance', (select points from public.profiles where user_id = uid), 'session_id', s.id);
end; $$;
grant execute on function public.complete_earning_session() to authenticated;
revoke execute on function public.complete_earning_session() from anon;

-- MISSION PROGRESS
create or replace function public.mission_state()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid(); today date := (now() at time zone 'utc')::date; result jsonb := '[]'::jsonb;
        m public.missions; prog int; pkey text; done boolean;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  for m in select * from public.missions where active order by sort_order loop
    pkey := case when m.repeatable then to_char(today,'YYYY-MM-DD') else 'ONCE' end;
    if m.mission_type = 'DAILY_SESSION' then
      select count(*) into prog from public.earning_sessions
        where user_id = uid and status='COMPLETED' and (ended_at at time zone 'utc')::date = today;
    elsif m.mission_type = 'STREAK' then
      select coalesce(current_streak,0) into prog from public.profiles where user_id = uid;
    elsif m.mission_type = 'QUALIFIED_REFERRALS' then
      select count(*) into prog from public.referrals r
        join public.profiles p on p.id = r.referrer_id
       where p.user_id = uid and r.status in ('QUALIFIED','REWARDED');
    else prog := 0; end if;
    done := exists (select 1 from public.mission_completions
      where user_id = uid and mission_id = m.id and period_key = pkey);
    result := result || jsonb_build_object(
      'id', m.id, 'code', m.code, 'title', m.title, 'description', m.description,
      'reward_points', m.reward_points, 'requirement', m.requirement,
      'progress', least(prog, m.requirement), 'claimed', done,
      'claimable', (prog >= m.requirement and not done));
  end loop;
  return result;
end; $$;
grant execute on function public.mission_state() to authenticated;
revoke execute on function public.mission_state() from anon;

create or replace function public.claim_mission(_mission_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); m public.missions; state jsonb; item jsonb; pkey text; tx uuid; cid uuid;
        today date := (now() at time zone 'utc')::date;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into m from public.missions where id = _mission_id and active;
  if m.id is null then raise exception 'MISSION_NOT_FOUND'; end if;
  state := public.mission_state();
  select value into item from jsonb_array_elements(state) v(value) where (value->>'id')::uuid = _mission_id;
  if item is null or not (item->>'claimable')::boolean then raise exception 'MISSION_NOT_CLAIMABLE'; end if;
  pkey := case when m.repeatable then to_char(today,'YYYY-MM-DD') else 'ONCE' end;
  insert into public.mission_completions (mission_id,user_id,period_key)
  values (m.id, uid, pkey) on conflict do nothing returning id into cid;
  if cid is null then raise exception 'ALREADY_CLAIMED'; end if;
  tx := public.credit_points(uid, m.reward_points, 'MISSION_REWARD', m.id,
    'mission:'||m.id::text||':'||uid::text||':'||pkey, m.title);
  update public.mission_completions set reward_transaction_id = tx where id = cid;
  perform public.notify(uid,'Mission complete','You earned '||m.reward_points||' SVP for "'||m.title||'".','MISSION');
  if (select count(*) from public.mission_completions where user_id = uid) >= 5 then
    perform public.award_achievement(uid,'MISSION_MASTER');
  end if;
  return jsonb_build_object('reward', m.reward_points, 'balance', (select points from public.profiles where user_id = uid));
end; $$;
grant execute on function public.claim_mission(uuid) to authenticated;
revoke execute on function public.claim_mission(uuid) from anon;

-- LEADERBOARD
create or replace function public.get_leaderboard(_period text default 'ALL', _limit int default 50, _offset int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare since timestamptz; rows jsonb;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  _limit := least(greatest(_limit,1),100);
  if _period = 'WEEKLY' then since := date_trunc('week', now() at time zone 'utc');
  elsif _period = 'MONTHLY' then since := date_trunc('month', now() at time zone 'utc');
  else since := null; end if;

  if since is null then
    select coalesce(jsonb_agg(x order by x->>'rank'),'[]'::jsonb) into rows from (
      select jsonb_build_object('rank', row_number() over (order by p.points desc, p.created_at),
        'user_id', p.user_id, 'name', coalesce(p.display_name, p.first_name, p.telegram_username,'Solvaner'),
        'username', p.telegram_username, 'photo_url', p.photo_url,
        'level', p.level_number, 'points', p.points) as x
      from public.profiles p where p.status = 'ACTIVE'
      order by p.points desc, p.created_at limit _limit offset _offset) t;
  else
    select coalesce(jsonb_agg(x order by x->>'rank'),'[]'::jsonb) into rows from (
      select jsonb_build_object('rank', row_number() over (order by sum(l.amount) desc),
        'user_id', p.user_id, 'name', coalesce(p.display_name, p.first_name, p.telegram_username,'Solvaner'),
        'username', p.telegram_username, 'photo_url', p.photo_url,
        'level', p.level_number, 'points', sum(l.amount)) as x
      from public.points_ledger l join public.profiles p on p.user_id = l.user_id
      where l.created_at >= since and p.status = 'ACTIVE' and l.amount > 0
      group by p.user_id, p.display_name, p.first_name, p.telegram_username, p.photo_url, p.level_number
      order by sum(l.amount) desc limit _limit offset _offset) t;
  end if;
  return rows;
end; $$;
grant execute on function public.get_leaderboard(text,int,int) to authenticated;
revoke execute on function public.get_leaderboard(text,int,int) from anon;

create or replace function public.my_rank()
returns int language sql stable security definer set search_path = public as $$
  select (count(*) + 1)::int from public.profiles
   where status='ACTIVE' and points > coalesce((select points from public.profiles where user_id = auth.uid()),0)
$$;
grant execute on function public.my_rank() to authenticated;
revoke execute on function public.my_rank() from anon;

-- REFERRAL ATTRIBUTION
create or replace function public.apply_referral(_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); me public.profiles; referrer public.profiles;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into me from public.profiles where user_id = uid;
  if me.referred_by is not null then return jsonb_build_object('ok',false,'reason','ALREADY_REFERRED'); end if;
  select * into referrer from public.profiles where upper(referral_code) = upper(trim(_code));
  if referrer.id is null then return jsonb_build_object('ok',false,'reason','INVALID_CODE'); end if;
  if referrer.id = me.id then return jsonb_build_object('ok',false,'reason','SELF_REFERRAL'); end if;
  if referrer.referred_by = me.id then return jsonb_build_object('ok',false,'reason','REFERRAL_LOOP'); end if;
  update public.profiles set referred_by = referrer.id where id = me.id;
  insert into public.referrals (referrer_id, referred_id, status) values (referrer.id, me.id, 'REGISTERED')
  on conflict (referred_id) do nothing;
  return jsonb_build_object('ok',true);
end; $$;
grant execute on function public.apply_referral(text) to authenticated;
revoke execute on function public.apply_referral(text) from anon;

-- ADMIN
create or replace function public.admin_adjust_points(_target uuid, _amount bigint, _reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); before_bal bigint; after_bal bigint;
begin
  if not public.has_role(uid,'admin') then raise exception 'FORBIDDEN'; end if;
  select points into before_bal from public.profiles where user_id = _target;
  if before_bal is null then raise exception 'USER_NOT_FOUND'; end if;
  perform public.credit_points(_target, _amount, 'ADMIN_ADJUSTMENT', uid,
    'admin:'||uid::text||':'||_target::text||':'||extract(epoch from clock_timestamp())::text, _reason);
  select points into after_bal from public.profiles where user_id = _target;
  insert into public.admin_audit_logs (admin_id,action,target_user_id,previous_value,new_value,reason)
  values (uid,'POINT_ADJUSTMENT',_target, jsonb_build_object('balance',before_bal),
          jsonb_build_object('balance',after_bal,'amount',_amount), _reason);
  perform public.notify(_target,'Balance adjusted', _reason, 'ADMIN');
  return jsonb_build_object('before',before_bal,'after',after_bal);
end; $$;
grant execute on function public.admin_adjust_points(uuid,bigint,text) to authenticated;
revoke execute on function public.admin_adjust_points(uuid,bigint,text) from anon;

create or replace function public.admin_set_status(_target uuid, _status text, _reason text)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); prev text;
begin
  if not public.has_role(uid,'admin') then raise exception 'FORBIDDEN'; end if;
  if _status not in ('ACTIVE','SUSPENDED','FLAGGED') then raise exception 'INVALID_STATUS'; end if;
  select status into prev from public.profiles where user_id = _target;
  update public.profiles set status = _status where user_id = _target;
  insert into public.admin_audit_logs (admin_id,action,target_user_id,previous_value,new_value,reason)
  values (uid,'STATUS_CHANGE',_target, jsonb_build_object('status',prev), jsonb_build_object('status',_status), _reason);
end; $$;
grant execute on function public.admin_set_status(uuid,text,text) to authenticated;
revoke execute on function public.admin_set_status(uuid,text,text) from anon;

create or replace function public.admin_stats()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare today date := (now() at time zone 'utc')::date;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'FORBIDDEN'; end if;
  return jsonb_build_object(
   'total_users',(select count(*) from public.profiles),
   'active_users',(select count(*) from public.profiles where status='ACTIVE'),
   'dau',(select count(*) from public.profiles where (last_active_at at time zone 'utc')::date = today),
   'flagged_users',(select count(*) from public.profiles where status<>'ACTIVE'),
   'total_points',(select coalesce(sum(amount),0) from public.points_ledger where amount>0),
   'points_today',(select coalesce(sum(amount),0) from public.points_ledger where amount>0 and (created_at at time zone 'utc')::date=today),
   'active_sessions',(select count(*) from public.earning_sessions where status='ACTIVE'),
   'completed_sessions',(select count(*) from public.earning_sessions where status='COMPLETED'),
   'total_referrals',(select count(*) from public.referrals),
   'qualified_referrals',(select count(*) from public.referrals where status in ('QUALIFIED','REWARDED')),
   'missions_completed',(select count(*) from public.mission_completions),
   'growth',(select coalesce(jsonb_agg(jsonb_build_object('date',d,'users',c) order by d),'[]'::jsonb)
      from (select (created_at at time zone 'utc')::date d, count(*) c from public.profiles
            where created_at > now() - interval '30 days' group by 1) g),
   'points_series',(select coalesce(jsonb_agg(jsonb_build_object('date',d,'points',c) order by d),'[]'::jsonb)
      from (select (created_at at time zone 'utc')::date d, sum(amount) c from public.points_ledger
            where created_at > now() - interval '30 days' and amount > 0 group by 1) s)
  );
end; $$;
grant execute on function public.admin_stats() to authenticated;
revoke execute on function public.admin_stats() from anon;

create or replace function public.admin_search_users(_q text default '', _limit int default 50)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'FORBIDDEN'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(p) order by p.points desc),'[]'::jsonb)
    from (select * from public.profiles
          where _q = '' or telegram_username ilike '%'||_q||'%' or first_name ilike '%'||_q||'%'
             or referral_code ilike '%'||_q||'%'
          order by points desc limit least(_limit,200)) p);
end; $$;
grant execute on function public.admin_search_users(text,int) to authenticated;
revoke execute on function public.admin_search_users(text,int) from anon;
