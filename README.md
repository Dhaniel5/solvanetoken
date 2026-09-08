# Solvane: Earn & Grow

The image attached is the logo for this @connector:telegram:"Telegram" mini app SOLVANE — TELEGRAM MINI APP MVP MASTER BUILD PROMPT



Build Solvane as a production-quality Telegram Mini App.



Solvane is a participation-driven crypto ecosystem. Users participate in daily earning sessions, complete missions, maintain streaks, refer friends, earn Solvane Points (SVP), level up and compete on leaderboards.



The current MVP uses Solvane Points (SVP) as an internal off-chain points system.



The future cryptocurrency will be $SVNE, but DO NOT launch, mint, distribute or simulate $SVNE at this stage.



The application must be architected so that $SVNE can be introduced later without rebuilding the core platform.



---



1. PRODUCT PRINCIPLE



Solvane is NOT a blockchain.



Solvane is NOT building its own blockchain.



Solvane is a Telegram-based application/ecosystem that may eventually use an existing blockchain for $SVNE.



For MVP:



Telegram Mini App

↓

Solvane Backend

↓

Solvane Points (SVP)

↓

Future $SVNE integration



Do not create fake blockchain functionality.



Do not display fake token balances.



Do not claim SVP has monetary value.



Do not tell users that SVP is currently convertible to $SVNE.



---



2. TECHNOLOGY



Use:



- React

- TypeScript

- Vite or the current Lovable-supported React stack

- Tailwind CSS

- Supabase

- PostgreSQL

- Telegram Mini Apps SDK/API where appropriate



The application must run correctly inside Telegram's mobile client.



It should also be possible to open the same application in a normal browser for development/testing.



Use environment variables for secrets.



Never expose Supabase service-role keys or private credentials in frontend code.



---



3. TELEGRAM MINI APP



Build Solvane specifically as a Telegram Mini App.



The application must:



- Detect Telegram WebApp environment

- Initialize Telegram WebApp

- Use Telegram theme information where appropriate

- Support Telegram's viewport correctly

- Respect safe areas/notches

- Work properly on Android and iOS Telegram clients

- Support Telegram's back button where appropriate

- Support Telegram haptic feedback where appropriate

- Use Telegram's native share capabilities where possible



The UI must feel native inside Telegram rather than like a desktop website squeezed into Telegram.



---



4. TELEGRAM AUTHENTICATION



Do NOT create a traditional email/password login as the primary authentication method.



Telegram should be the primary identity.



When the user opens the Mini App:



1. Obtain Telegram Mini App initialization data.

2. Send the initialization data to a secure backend endpoint.

3. Verify the Telegram authentication data server-side.

4. Extract the verified Telegram user ID.

5. Create or retrieve the corresponding Solvane profile.

6. Create a secure application session.

7. Return the authenticated user to the Mini App.



NEVER trust a Telegram user ID submitted directly by the client.



The backend must verify Telegram's signed initialization data.



---



5. USER PROFILE



Create a user profile based on Telegram identity.



Store:



- Internal Solvane user ID

- Telegram user ID

- Telegram username

- First name

- Last name where available

- Profile photo where available

- Referral code

- Referred by

- Solvane Points

- Current streak

- Longest streak

- Current level

- Account status

- Created timestamp

- Last active timestamp



Do not expose unnecessary Telegram information publicly.



Users should be able to edit Solvane-specific profile information where appropriate.



Telegram identity information should be controlled by the Telegram account.



---



6. FIRST-TIME USER FLOW



When a new Telegram user opens Solvane:



Show a short onboarding flow.



Screen 1



Welcome to Solvane



"Participate. Earn. Build."



Screen 2



Explain Solvane Points.



"Earn SVP by participating in the Solvane ecosystem."



Clearly state:



"SVP are internal Solvane Points and are not currently a cryptocurrency."



Screen 3



Explain earning.



"Activate your daily earning session and build your streak."



Screen 4



Explain referrals.



"Invite people and grow the Solvane community."



Screen 5



Start.



Button:



START EARNING



Keep onboarding short.



---



7. MAIN NAVIGATION



Create bottom navigation optimized for mobile.



Tabs:



1. Home

2. Earn

3. Missions

4. Referrals

5. Leaderboard



Profile should be accessible from the top-right avatar.



---



8. HOME DASHBOARD



Create the main Solvane dashboard.



Header:



"Welcome, [Telegram first name]"



Display:



SVP Balance



Large number.



Example:



"12,450 SVP"



Current Level



Example:



"Level 3 — Builder"



Current Streak



Example:



"🔥 7 days"



Global Rank



Example:



"#1,842"



---



9. PRIMARY EARNING CARD



The most prominent component should be the earning card.



Inactive:



Ready to Earn



Show:



- Current base earning rate

- Current multiplier

- Today's progress



Button:



⚡ START EARNING



Active:



EARNING ACTIVE



Show:



- Current earning rate

- Multiplier

- Time remaining

- Session progress

- Points earned in current session



Button should NOT allow another session to start.



Completed:



SESSION COMPLETE



Show:



- Points earned

- Updated balance

- Updated streak



Button:



START NEXT SESSION



---



10. EARNING ENGINE



This is an internal points earning mechanism.



It is NOT cryptocurrency mining.



Use the term:



Earning Session



Internally the code may use:



"earning_sessions"



Do not call this blockchain mining.



The backend must be authoritative.



When the user presses START EARNING:



Create a database earning session.



Store:



- session ID

- user ID

- started_at

- expected_end_at

- status

- base_rate

- multiplier

- points_accrued

- created_at



The client timer is only a visual representation.



Never calculate the user's final points using the client timer.



The backend must determine:



- Session validity

- Duration

- Points earned

- Completion

- Reward



---



11. PREVENT MULTIPLE ACTIVE SESSIONS



A user must only have one active earning session.



Enforce this at the database/server level.



Do not rely only on frontend button disabling.



If a user attempts to create a second active session:



Return a controlled error.



---



12. POINTS LEDGER



Do NOT simply increment a balance without recording the transaction.



Create an immutable points ledger.



Every reward must produce a ledger transaction.



Transaction types:



- EARNING_SESSION

- MISSION_REWARD

- REFERRAL_REWARD

- STREAK_BONUS

- LEVEL_BONUS

- ADMIN_ADJUSTMENT

- REVERSAL

- PROMOTIONAL_REWARD



Fields:



- id

- user_id

- amount

- transaction_type

- reference_id

- idempotency_key

- description

- metadata

- created_at



Prevent duplicate transactions.



A reward must never be issued twice for the same qualifying event.



---



13. POINT BALANCE



The user's visible SVP balance must be reliable.



Create server-side logic for:



- Credit points

- Debit points

- Recalculate/reconcile balance

- Validate ledger consistency



Users must never be able to submit:



"+100000 SVP"



from the frontend.



All balance-changing operations must happen server-side.



---



14. DAILY STREAK



Implement a daily participation streak.



Track:



- Current streak

- Longest streak

- Last qualifying activity



Example:



Day 1 = 1.0x



Day 2 = 1.05x



Day 3 = 1.10x



Day 7 = 1.25x



These are DEFAULT development values.



Do not hardcode the final Solvane economy.



Make the values configurable.



Use UTC internally and implement a consistent platform timezone policy.



---



15. MISSIONS



Create the Missions screen.



Show:



Available



- Complete today's earning session

- Maintain a 3-day streak

- Maintain a 7-day streak

- Invite your first friend

- Invite 5 qualified users



Each mission should show:



- Mission name

- Description

- Progress

- Reward

- Completion status



Example:



7-Day Streak



"5 / 7 days"



Reward:



"+500 SVP"



Button:



IN PROGRESS



or



CLAIM REWARD



depending on mission design.



Prevent duplicate mission rewards.



---



16. MISSION DATABASE



Create:



"missions"



Fields:



- id

- title

- description

- mission_type

- requirement

- reward_points

- active

- start_date

- end_date

- max_completions

- created_at

- updated_at



Create:



"mission_completions"



Fields:



- id

- mission_id

- user_id

- reward_transaction_id

- completed_at



Use unique constraints where necessary.



---



17. REFERRALS



Every user receives a unique referral code.



Example:



"SOLV-8K4M2"



Generate a Telegram-compatible referral link using the Mini App/bot deep-link mechanism.



Create:



Invite Friends



button.



When pressed:



Open Telegram's native sharing mechanism where supported.



Message example:



"Join me on Solvane and start earning Solvane Points."



Include the user's referral link.



---



18. REFERRAL ATTRIBUTION



When a user enters Solvane through a referral link:



1. Parse the referral/start parameter.

2. Validate the referral code server-side.

3. Identify the referrer.

4. Create a referral relationship.

5. Prevent self-referral.

6. Prevent duplicate referral relationships.

7. Track referral status.



Referral statuses:



- INVITED

- REGISTERED

- QUALIFIED

- REWARDED

- FLAGGED



---



19. QUALIFIED REFERRALS



Do NOT reward referrals simply because someone opened the app.



Create a configurable qualification requirement.



Default:



A referral becomes qualified after:



- Completing onboarding

- Becoming an active user

- Completing at least one earning session



Only after qualification should the referral reward be issued.



Prevent:



- Self-referrals

- Duplicate referrals

- Reward duplication

- Referral loops



---



20. REFERRAL SCREEN



Show:



Your Referral Code



"SOLV-8K4M2"



Buttons:



Copy Code



Invite Friends



Stats:



- Invited

- Registered

- Qualified

- Rewards earned



Show referral history.



Do not expose private information about referred users.



---



21. LEADERBOARD



Create:



Solvane Leaderboard



Tabs:



- All Time

- Weekly

- Monthly



Default ranking:



Total Solvane Points.



Each row:



- Rank

- Avatar

- Username

- Level

- SVP



Highlight current user.



Example:



"#1 Alex — 125,400 SVP"



"#2 Sarah — 118,300 SVP"



"#3 Michael — 102,800 SVP"



Use pagination.



Do not expose user email, Telegram ID or private information.



---



22. LEVEL SYSTEM



Create configurable levels.



Initial development levels:



Level 1 — Explorer



Level 2 — Contributor



Level 3 — Builder



Level 4 — Pioneer



Level 5 — Vanguard



Level 6 — Luminary



Store levels in the database.



Each level can contain:



- Name

- Required points

- Multiplier

- Badge

- Benefits



Do not hardcode thresholds into React.



---



23. ACHIEVEMENTS



Create achievement badges.



Examples:



- First Earning Session

- 3-Day Streak

- 7-Day Streak

- 30-Day Streak

- First Referral

- 10 Qualified Referrals

- Mission Master



Store achievements in the database.



Award them automatically when requirements are met.



Prevent duplicate unlocks.



---



24. NOTIFICATIONS



Create in-app notifications.



Examples:



"Your earning session is complete."



"You earned 500 SVP."



"You reached a 7-day streak."



"Congratulations! You reached Level 3."



"Your referral has qualified."



"New mission available."



Display notification badge when unread.



---



25. TELEGRAM UX FEATURES



Use Telegram-specific functionality where appropriate:



- Telegram theme

- Haptic feedback

- Back button

- Main button only when appropriate

- Native sharing

- Safe area handling

- Viewport expansion



Do not overuse haptics or Telegram-specific effects.



The interface should still feel like Solvane.



---



26. ADMIN PANEL



Create an admin interface.



It should NOT be accessible to ordinary users.



Admin routes:



"/admin"



"/admin/users"



"/admin/earning"



"/admin/missions"



"/admin/referrals"



"/admin/leaderboard"



"/admin/economy"



"/admin/analytics"



"/admin/audit-logs"



---



27. ADMIN DASHBOARD



Display:



- Total users

- Active users

- Today's active users

- Total SVP issued

- Today's SVP issued

- Active earning sessions

- Completed sessions

- Total referrals

- Qualified referrals

- Missions completed

- Flagged users



Charts:



- User growth

- Daily active users

- Points issued

- Referral growth

- Earning activity



Do not fabricate data.



Use real database data.



---



28. ADMIN USER MANAGEMENT



Admin can:



- Search users

- View user profile

- View points history

- View earning sessions

- View referrals

- View achievements

- Suspend user

- Unsuspend user

- Flag user



Admins cannot directly edit historical ledger entries.



---



29. ADMIN POINT ADJUSTMENTS



Allow authorized administrators to issue manual point adjustments.



Require:



- Amount

- User

- Reason



Create:



1. Points ledger entry

2. Admin audit log



Store:



- Admin ID

- Before balance

- Adjustment

- After balance

- Reason

- Timestamp



---



30. ADMIN ECONOMY SETTINGS



Create configurable settings for:



- Base earning rate

- Session duration

- Daily maximum

- Streak multipliers

- Mission rewards

- Referral rewards

- Referral qualification rules

- Level thresholds



Changes should affect future activity.



Do not retroactively modify previous ledger transactions.



---



31. FEATURE FLAGS



Create feature flags:



"EARNING_ENABLED"



"MISSIONS_ENABLED"



"REFERRALS_ENABLED"



"LEADERBOARD_ENABLED"



"ACHIEVEMENTS_ENABLED"



"WALLET_ENABLED"



"SVNE_ENABLED"



"TOKEN_CLAIMS_ENABLED"



Default:



"SVNE_ENABLED = false"



"TOKEN_CLAIMS_ENABLED = false"



"WALLET_ENABLED = false"



---



32. FUTURE $SVNE ARCHITECTURE



Prepare the database for future $SVNE.



Create a token configuration structure.



Fields:



- token_name

- symbol

- blockchain

- contract_address

- decimals

- status

- created_at



Initial status:



"NOT_LAUNCHED"



Do not display a fake contract address.



Do not show fake $SVNE balances.



Do not simulate token transfers.



---



33. FUTURE WALLET ARCHITECTURE



Create:



"user_wallets"



Fields:



- id

- user_id

- blockchain

- wallet_address

- wallet_type

- verified

- primary_wallet

- created_at



Keep wallet connection disabled for MVP.



Architecture should later support Solana wallets such as Phantom.



---



34. FUTURE SVP → $SVNE CONVERSION



Create the conceptual architecture for a future conversion system.



Do NOT activate it.



Possible table:



"conversion_rules"



Fields:



- id

- points_required

- token_amount

- effective_date

- eligibility_rules

- status



Do NOT assume:



"1 SVP = 1 $SVNE"



There must be no conversion promise in the MVP.



---



35. DATABASE SECURITY



Use Supabase Row Level Security.



Users can access only their own private information.



Users can read:



- Own profile

- Own earning sessions

- Own points ledger

- Own referrals

- Own missions

- Own notifications

- Public leaderboard data



Users cannot:



- Modify points

- Modify ledger

- Modify referral rewards

- Modify levels

- Modify economy settings

- Modify missions

- Access admin data

- Change their role



Admin permissions must be enforced server-side/database-side.



---



36. ANTI-ABUSE



Implement basic anti-abuse architecture.



Protect against:



- Multiple active sessions

- Duplicate rewards

- Self-referrals

- Duplicate referrals

- Rapid suspicious activity

- Reward replay

- Client-side balance manipulation



Use:



- Database constraints

- Idempotency keys

- Server-side validation

- Rate limiting where appropriate

- Audit logs



Do not build invasive surveillance.



---



37. ADMIN AUDIT LOG



Create:



"admin_audit_logs"



Store:



- admin_id

- action

- target_user_id

- previous_value

- new_value

- reason

- created_at

- metadata



Important administrative actions must be logged.



---



38. API/SERVICE STRUCTURE



Do not place business logic inside UI components.



Create service modules:



"telegramAuthService"



"userService"



"earningService"



"pointsService"



"missionService"



"referralService"



"leaderboardService"



"levelService"



"achievementService"



"notificationService"



"adminService"



"walletService"



"tokenService"



Business-critical operations must be server-side.



---



39. PROJECT STRUCTURE



Use a clean architecture.



Suggested:



"src/"



"components/"



"pages/"



"layouts/"



"services/"



"hooks/"



"lib/"



"types/"



"utils/"



"integrations/telegram/"



"integrations/supabase/"



Do not create giant components.



Use reusable UI components.



---



40. LOADING AND ERROR STATES



Every major operation needs:



- Loading state

- Skeleton state

- Empty state

- Error state

- Retry option



Examples:



"No missions available."



"You haven't referred anyone yet."



"Your earning session is complete."



"Something went wrong. Try again."



Do not expose raw database errors.



---



41. MOBILE-FIRST DESIGN



The primary target is Telegram mobile.



Optimize for:



- Android

- iOS

- Small screens

- One-handed use

- Touch targets

- Fast navigation



Then ensure the app also works on desktop Telegram and regular browsers.



---



42. PERFORMANCE



Optimize:



- Database queries

- Leaderboard pagination

- Lazy loading

- React rendering

- API requests

- Caching where appropriate



Do not fetch the entire user database for a leaderboard.



---



43. DEVELOPMENT MODE



Create a safe development/testing mode.



It should allow authorized development users to test:



- Earning

- Missions

- Referrals

- Leaderboards

- Level progression



Do not mix test data with production data.



Clearly separate development/test environment from production.



---



44. TESTING CHECKLIST



Before declaring the MVP complete, test:



Authentication



- New Telegram user

- Existing Telegram user

- Invalid Telegram authentication data

- Session persistence



Earning



- Start session

- Active session

- Completed session

- Duplicate session attempt

- Correct point calculation

- Ledger transaction created



Referrals



- Valid referral

- Invalid referral

- Self-referral

- Duplicate referral

- Qualified referral

- Reward issued once



Missions



- Mission progress

- Mission completion

- Reward

- Duplicate claim prevention



Leaderboard



- Ranking

- User position

- Pagination

- Weekly/monthly filters



Admin



- Admin access

- Non-admin rejection

- Point adjustment

- Audit log

- User suspension



Security



- RLS

- Client manipulation attempts

- Unauthorized database requests

- Privilege escalation attempts



---



45. UI DETAILS



Make the interface feel premium.



Use:



- Smooth transitions

- Subtle animations

- Progress bars

- Cards

- Clean typography

- Clear hierarchy

- Haptic feedback for important actions

- Friendly empty states



Do NOT over-animate.



Do NOT make it look like a casino or meme coin.



Solvane should feel like a serious technology product.



---



46. HOME SCREEN PRIORITY



The user should understand these things within 3 seconds:



1. How many SVP they have

2. Whether they are currently earning

3. How to start earning

4. Their streak

5. Their rank



The primary CTA should always be obvious.



---



47. BRAND LANGUAGE



Use consistent terminology:



"Solvane"



"Solvane Points"



"SVP"



"Earning Session"



"Streak"



"Missions"



"Referrals"



"Leaderboard"



"Level"



"$SVNE — Coming Later"



Do not call SVP a cryptocurrency.



Do not call the current earning system blockchain mining.



---



48. FUTURE ARCHITECTURE



The backend should remain independent from Telegram as much as reasonably possible.



The future architecture should allow:



Telegram Mini App

+

Web App

+

Mobile App



to use the same:



- User system

- Points ledger

- Missions

- Referrals

- Leaderboard

- Economy

- Admin

- Analytics



Telegram is the FIRST distribution channel, not the permanent technical dependency.



---



49. IMPORTANT: DO NOT OVERBUILD



For the first working version, prioritize:



1. Telegram authentication

2. User creation

3. Dashboard

4. SVP balance

5. Earning session

6. Points ledger

7. Streak

8. Missions

9. Referrals

10. Leaderboard

11. Profile

12. Basic admin panel



Do not spend time building $SVNE blockchain functionality now.



Do not create unnecessary complexity.



---



50. FINAL REQUIREMENT



Build the actual Solvane Telegram Mini App, not a generic website mockup.



The result must:



- Open correctly inside Telegram

- Authenticate Telegram users securely

- Persist users in Supabase

- Allow users to start earning sessions

- Award SVP through server-side logic

- Track the points ledger

- Track streaks

- Track missions

- Track referrals

- Display leaderboards

- Provide an admin panel

- Enforce permissions

- Have proper database security

- Be mobile-first

- Be visually polished

- Be ready for real MVP testing



Most importantly:



Do not fake functionality.



If a future feature such as $SVNE or wallet integration is not implemented yet, show it as disabled/coming later rather than pretending it exists.



Build Solvane as a real Telegram Mini App MVP that we can test with real users.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://solvanetoken.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b2685b75-dc20-4b8d-b8e0-daf3492d49d6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
