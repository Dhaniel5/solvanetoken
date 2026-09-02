
do $$
declare f record;
begin
  for f in select p.oid::regprocedure::text as sig from pg_proc p
           join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prosecdef loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

grant execute on function public.start_earning_session() to authenticated;
grant execute on function public.complete_earning_session() to authenticated;
grant execute on function public.mission_state() to authenticated;
grant execute on function public.claim_mission(uuid) to authenticated;
grant execute on function public.get_leaderboard(text,int,int) to authenticated;
grant execute on function public.my_rank() to authenticated;
grant execute on function public.apply_referral(text) to authenticated;
grant execute on function public.admin_adjust_points(uuid,bigint,text) to authenticated;
grant execute on function public.admin_set_status(uuid,text,text) to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_search_users(text,int) to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
