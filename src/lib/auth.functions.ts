import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHmac, createHash, createPublicKey, verify as edVerify } from "crypto";

/**
 * Telegram identity -> Solvane session.
 *
 * The client never states who it is: it forwards Telegram's signed
 * initData, the server verifies Telegram's Ed25519 signature, and only the
 * verified Telegram user id is trusted.
 */

const TELEGRAM_BOT_ID = 8864514478;
// Telegram's public key for third-party validation of Mini App init data.
const TELEGRAM_PUBLIC_KEY_HEX = "e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d";
const MAX_AUTH_AGE_SECONDS = 86400;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export interface SolvaneSession {
  access_token: string;
  refresh_token: string;
}

interface TelegramUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

function ed25519PublicKey() {
  const der = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    Buffer.from(TELEGRAM_PUBLIC_KEY_HEX, "hex"),
  ]);
  return createPublicKey({ key: der, format: "der", type: "spki" });
}

function verifyInitData(initData: string): TelegramUser {
  const params = new URLSearchParams(initData);
  const signature = params.get("signature");
  const authDate = Number(params.get("auth_date") ?? 0);
  const rawUser = params.get("user");
  if (!signature || !rawUser) throw new Error("INVALID_INIT_DATA");
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) throw new Error("INIT_DATA_EXPIRED");

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === "hash" || key === "signature") return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const message = `${TELEGRAM_BOT_ID}:WebAppData\n${pairs.join("\n")}`;
  const ok = edVerify(
    null,
    Buffer.from(message, "utf8"),
    ed25519PublicKey(),
    Buffer.from(signature.replace(/-/g, "+").replace(/_/g, "/"), "base64"),
  );
  if (!ok) throw new Error("INVALID_SIGNATURE");

  const user = JSON.parse(rawUser) as TelegramUser;
  if (!user?.id) throw new Error("INVALID_INIT_DATA");
  return user;
}

function derivePassword(telegramId: number | string) {
  const secret = process.env["SOLVANE_AUTH_SECRET"];
  if (!secret) throw new Error("AUTH_SECRET_MISSING");
  return createHmac("sha256", secret).update(`solvane:${telegramId}`).digest("hex");
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function uniqueReferralCode(admin: { from: (t: string) => any }) {
  for (let attempt = 0; attempt < 8; attempt++) {
    let suffix = "";
    for (let i = 0; i < 5; i++) suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    const code = `SOLV-${suffix}`;
    const { data } = await admin.from("profiles").select("id").eq("referral_code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("REFERRAL_CODE_GENERATION_FAILED");
}

async function signInAsTelegramUser(user: TelegramUser, isTest: boolean): Promise<SolvaneSession> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const email = `tg${user.id}@solvane.app`;
  const password = derivePassword(user.id);

  const { data: existing } = await admin
    .from("profiles")
    .select("id, user_id")
    .eq("telegram_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { telegram_id: user.id, provider: "telegram" },
    });
    if (createError || !created?.user) throw new Error("ACCOUNT_CREATION_FAILED");

    const code = await uniqueReferralCode(admin);
    const { error: profileError } = await admin.from("profiles").insert({
      user_id: created.user.id,
      telegram_id: user.id,
      telegram_username: user.username ?? null,
      first_name: user.first_name ?? null,
      last_name: user.last_name ?? null,
      photo_url: user.photo_url ?? null,
      referral_code: code,
      is_test: isTest,
    });
    if (profileError) throw new Error("PROFILE_CREATION_FAILED");
  } else {
    await admin
      .from("profiles")
      .update({
        telegram_username: user.username ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        photo_url: user.photo_url ?? null,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  }

  const { data: session, error } = await publicClient().auth.signInWithPassword({ email, password });
  if (error || !session.session) throw new Error("SESSION_FAILED");
  return {
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
  };
}

export const telegramSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: { initData: string }) => {
    if (!input?.initData || typeof input.initData !== "string" || input.initData.length > 8192) {
      throw new Error("INVALID_INIT_DATA");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const user = verifyInitData(data.initData);
    return signInAsTelegramUser(user, false);
  });

/**
 * Browser testing mode. Enabled by the DEV_MODE_ENABLED feature flag and
 * always creates clearly-flagged test accounts, never Telegram identities.
 */
export const devSignIn = createServerFn({ method: "POST" })
  .inputValidator((input: { deviceKey: string }) => {
    if (!input?.deviceKey || input.deviceKey.length < 8 || input.deviceKey.length > 128) {
      throw new Error("INVALID_DEVICE_KEY");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const { data: flag } = await admin
      .from("feature_flags")
      .select("enabled")
      .eq("key", "DEV_MODE_ENABLED")
      .maybeSingle();
    if (!flag?.enabled) throw new Error("DEV_MODE_DISABLED");

    const digest = createHash("sha256").update(`dev:${data.deviceKey}`).digest();
    const pseudoId = -(digest.readUInt32BE(0) * 1000 + digest.readUInt8(4));
    return signInAsTelegramUser(
      { id: pseudoId, first_name: "Tester", username: `tester_${Math.abs(pseudoId) % 100000}` },
      true,
    );
  });
