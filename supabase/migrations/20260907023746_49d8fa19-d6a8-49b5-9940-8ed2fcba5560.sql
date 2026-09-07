create or replace function public.complete_earning_session()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare uid uuid := auth.uid(); s public.earning_sessions; p public.profiles;
        earned bigint; today date := (now() at time zone 'utc')::date; issued_today bigint;
        daily_max bigint; tx uuid; ref public.referrals; new_streak int; secs numeric;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into s from public.earning_sessions where user_id = uid and status = 'ACTIVE' for update;
  if s.id is null then raise exception 'NO_ACTIVE_SESSION'; end if;

  secs := extract(epoch from (least(now(), s.expected_end_at) - s.started_at));
  if secs < 0 then secs := 0; end if;
  earned := floor(s.base_rate * s.multiplier * secs / 3600.0);
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
end; $fn$;

revoke execute on function public.complete_earning_session() from public, anon;
grant execute on function public.complete_earning_session() to authenticated;