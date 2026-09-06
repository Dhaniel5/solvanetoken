# Verify Solvane Login Flow

Goal: confirm the current auto-login flow works in the preview and that a valid Solvane session + profile is created.

## Steps

1. **Build/typecheck check**
   - Run the TypeScript check to catch any compile errors before testing.

2. **Browser preview dev login**
   - Load the preview in a headless browser (normal browser, not Telegram).
   - The app should fall back to `devSignIn` because `initData` is absent.
   - Capture the dashboard screenshot and confirm the user sees their SVP balance and level progress.

3. **Verify backend state**
   - Query the `profiles` table to confirm a test profile was created with `is_test = true` and a referral code.
   - Confirm the user has an active Supabase session.

4. **Validate Telegram auth signature logic (offline)**
   - Use a known-good Telegram Mini App `initData` sample and the server's Ed25519 verification to confirm the signature check accepts valid data and rejects tampered data.
   - This does not require a real Telegram client; it only exercises the verification function.

5. **Report results**
   - Summarize what worked, any errors from console/network/logs, and next fixes if needed.

## Out of scope

- No changes to the login UX (user chose to keep auto-login).
- No new features; this is verification only.
