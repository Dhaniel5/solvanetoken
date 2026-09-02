
-- ROLES
create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- LEVELS
create table public.levels (
  id uuid primary key default gen_random_uuid(),
  level_number int not null unique,
  name text not null,
  required_points bigint not null default 0,
  multiplier numeric not null default 1.0,
  badge text,
  benefits text,
  created_at timestamptz not null default now()
);
grant select on public.levels to authenticated;
grant all on public.levels to service_role;
alter table public.levels enable row level security;
create policy "levels readable" on public.levels for select to authenticated using (true);
create policy "levels admin write" on public.levels for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.levels (level_number,name,required_points,multiplier,badge) values
 (1,'Explorer',0,1.00,'compass'),
 (2,'Contributor',2500,1.05,'spark'),
 (3,'Builder',10000,1.10,'hammer'),
 (4,'Pioneer',30000,1.15,'flag'),
 (5,'Vanguard',75000,1.20,'shield'),
 (6,'Luminary',150000,1.30,'star');

-- ECONOMY SETTINGS
create table public.economy_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);
grant select on public.economy_settings to authenticated;
grant all on public.economy_settings to service_role;
alter table public.economy_settings enable row level security;
create policy "settings readable" on public.economy_settings for select to authenticated using (true);
create policy "settings admin write" on public.economy_settings for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.economy_settings (key,value,description) values
 ('base_rate_per_hour','10','Base SVP earned per hour of an earning session'),
 ('session_duration_seconds','14400','Length of one earning session'),
 ('daily_max_points','2000','Maximum SVP a user can earn from sessions per UTC day'),
 ('streak_multipliers','{"1":1.0,"2":1.05,"3":1.10,"4":1.15,"5":1.18,"6":1.22,"7":1.25}','Streak day to multiplier map; highest key applies beyond'),
 ('referral_reward_points','750','SVP granted to referrer when a referral qualifies'),
 ('referral_welcome_points','250','SVP granted to the referred user on qualification'),
 ('referral_qualification','{"require_session":true,"require_onboarding":true}','Rules a referral must satisfy to qualify');

-- FEATURE FLAGS
create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);
grant select on public.feature_flags to authenticated;
grant all on public.feature_flags to service_role;
alter table public.feature_flags enable row level security;
create policy "flags readable" on public.feature_flags for select to authenticated using (true);
create policy "flags admin write" on public.feature_flags for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.feature_flags (key,enabled,description) values
 ('EARNING_ENABLED',true,'Earning sessions'),
 ('MISSIONS_ENABLED',true,'Missions'),
 ('REFERRALS_ENABLED',true,'Referrals'),
 ('LEADERBOARD_ENABLED',true,'Leaderboard'),
 ('ACHIEVEMENTS_ENABLED',true,'Achievements'),
 ('WALLET_ENABLED',false,'Wallet connection'),
 ('SVNE_ENABLED',false,'$SVNE token'),
 ('TOKEN_CLAIMS_ENABLED',false,'Token claims'),
 ('DEV_MODE_ENABLED',true,'Allow browser dev sign-in outside Telegram');

-- PROFILES
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  telegram_id bigint unique,
  telegram_username text,
  first_name text,
  last_name text,
  photo_url text,
  display_name text,
  referral_code text not null unique,
  referred_by uuid references public.profiles(id),
  points bigint not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  level_number int not null default 1,
  status text not null default 'ACTIVE',
  onboarded boolean not null default false,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (user_id = auth.uid());
create policy "admin profile read" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- protect sensitive columns from client updates
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_setting('role', true) = 'authenticated' then
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
end; $$;
create trigger trg_protect_profile before update on public.profiles for each row execute function public.protect_profile_columns();

-- EARNING SESSIONS
create table public.earning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default now(),
  expected_end_at timestamptz not null,
  ended_at timestamptz,
  status text not null default 'ACTIVE',
  base_rate numeric not null,
  multiplier numeric not null default 1.0,
  points_accrued bigint not null default 0,
  created_at timestamptz not null default now()
);
create unique index one_active_session_per_user on public.earning_sessions (user_id) where status = 'ACTIVE';
create index earning_sessions_user_idx on public.earning_sessions (user_id, created_at desc);
grant select on public.earning_sessions to authenticated;
grant all on public.earning_sessions to service_role;
alter table public.earning_sessions enable row level security;
create policy "own sessions read" on public.earning_sessions for select to authenticated using (user_id = auth.uid());
create policy "admin sessions read" on public.earning_sessions for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- POINTS LEDGER
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount bigint not null,
  transaction_type text not null,
  reference_id uuid,
  idempotency_key text not null unique,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
grant select on public.points_ledger to authenticated;
grant all on public.points_ledger to service_role;
alter table public.points_ledger enable row level security;
create policy "own ledger read" on public.points_ledger for select to authenticated using (user_id = auth.uid());
create policy "admin ledger read" on public.points_ledger for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- MISSIONS
create table public.missions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  mission_type text not null,
  requirement int not null default 1,
  reward_points int not null default 0,
  active boolean not null default true,
  repeatable boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  max_completions int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.missions to authenticated;
grant all on public.missions to service_role;
alter table public.missions enable row level security;
create policy "missions readable" on public.missions for select to authenticated using (true);
create policy "missions admin write" on public.missions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.missions (code,title,description,mission_type,requirement,reward_points,repeatable,sort_order) values
 ('DAILY_SESSION','Complete today''s earning session','Finish one earning session today','DAILY_SESSION',1,100,true,1),
 ('STREAK_3','Maintain a 3-day streak','Participate three days in a row','STREAK',3,200,false,2),
 ('STREAK_7','Maintain a 7-day streak','Participate seven days in a row','STREAK',7,500,false,3),
 ('REFERRAL_1','Invite your first friend','Get one qualified referral','QUALIFIED_REFERRALS',1,300,false,4),
 ('REFERRAL_5','Invite 5 qualified users','Get five qualified referrals','QUALIFIED_REFERRALS',5,1500,false,5);

create table public.mission_completions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_transaction_id uuid references public.points_ledger(id),
  period_key text not null default 'ONCE',
  completed_at timestamptz not null default now(),
  unique (mission_id, user_id, period_key)
);
grant select on public.mission_completions to authenticated;
grant all on public.mission_completions to service_role;
alter table public.mission_completions enable row level security;
create policy "own completions read" on public.mission_completions for select to authenticated using (user_id = auth.uid());
create policy "admin completions read" on public.mission_completions for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- REFERRALS
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'REGISTERED',
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  check (referrer_id <> referred_id)
);
create index referrals_referrer_idx on public.referrals (referrer_id, created_at desc);
grant select on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "own referrals read" on public.referrals for select to authenticated using (
  referrer_id in (select id from public.profiles where user_id = auth.uid())
);
create policy "admin referrals read" on public.referrals for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ACHIEVEMENTS
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text,
  icon text,
  created_at timestamptz not null default now()
);
grant select on public.achievements to authenticated;
grant all on public.achievements to service_role;
alter table public.achievements enable row level security;
create policy "achievements readable" on public.achievements for select to authenticated using (true);
create policy "achievements admin write" on public.achievements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.achievements (code,title,description,icon) values
 ('FIRST_SESSION','First Earning Session','Completed your first earning session','zap'),
 ('STREAK_3','3-Day Streak','Participated three days in a row','flame'),
 ('STREAK_7','7-Day Streak','Participated seven days in a row','flame'),
 ('STREAK_30','30-Day Streak','Participated thirty days in a row','flame'),
 ('FIRST_REFERRAL','First Referral','Your first referral qualified','users'),
 ('REFERRALS_10','10 Qualified Referrals','Ten referrals qualified','users'),
 ('MISSION_MASTER','Mission Master','Completed five missions','target');

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
grant select on public.user_achievements to authenticated;
grant all on public.user_achievements to service_role;
alter table public.user_achievements enable row level security;
create policy "own achievements read" on public.user_achievements for select to authenticated using (user_id = auth.uid());

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'INFO',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ADMIN AUDIT LOGS
create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_user_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.admin_audit_logs to authenticated;
grant all on public.admin_audit_logs to service_role;
alter table public.admin_audit_logs enable row level security;
create policy "admin audit read" on public.admin_audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- FUTURE TOKEN / WALLET / CONVERSION ARCHITECTURE (inactive)
create table public.token_config (
  id uuid primary key default gen_random_uuid(),
  token_name text not null,
  symbol text not null,
  blockchain text,
  contract_address text,
  decimals int,
  status text not null default 'NOT_LAUNCHED',
  created_at timestamptz not null default now()
);
grant select on public.token_config to authenticated;
grant all on public.token_config to service_role;
alter table public.token_config enable row level security;
create policy "token config readable" on public.token_config for select to authenticated using (true);
create policy "token config admin write" on public.token_config for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.token_config (token_name,symbol,blockchain,status) values ('Solvane','SVNE',null,'NOT_LAUNCHED');

create table public.user_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blockchain text not null,
  wallet_address text not null,
  wallet_type text,
  verified boolean not null default false,
  primary_wallet boolean not null default false,
  created_at timestamptz not null default now(),
  unique (blockchain, wallet_address)
);
grant select on public.user_wallets to authenticated;
grant all on public.user_wallets to service_role;
alter table public.user_wallets enable row level security;
create policy "own wallets read" on public.user_wallets for select to authenticated using (user_id = auth.uid());

create table public.conversion_rules (
  id uuid primary key default gen_random_uuid(),
  points_required bigint not null,
  token_amount numeric not null,
  effective_date timestamptz,
  eligibility_rules jsonb not null default '{}'::jsonb,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now()
);
grant select on public.conversion_rules to authenticated;
grant all on public.conversion_rules to service_role;
alter table public.conversion_rules enable row level security;
create policy "conversion readable" on public.conversion_rules for select to authenticated using (true);
create policy "conversion admin write" on public.conversion_rules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
