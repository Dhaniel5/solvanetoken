CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
begin
  -- Only block direct edits by signed-in users. Trusted server functions
  -- (SECURITY DEFINER) run as their owner, so current_user differs.
  if current_user = 'authenticated' then
    new.points := old.points;
    new.current_streak := old.current_streak;
    new.longest_streak := old.longest_streak;
    new.level_number := old.level_number;
    new.status := old.status;
    new.referral_code := old.referral_code;
    new.referred_by := old.referred_by;
    new.telegram_id := old.telegram_id;
  end if;
  return new;
end; $function$;