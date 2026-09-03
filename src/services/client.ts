import { supabase } from "@/integrations/supabase/client";

/**
 * Loosely typed access to the Solvane schema. Generated types lag behind
 * migrations, so services own their own row shapes.
 */
export const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
};

const FRIENDLY: Record<string, string> = {
  NOT_AUTHENTICATED: "Your session expired. Reopen the app to continue.",
  NO_PROFILE: "We couldn't find your profile. Try reopening the app.",
  ACCOUNT_NOT_ACTIVE: "This account is restricted. Contact support if that seems wrong.",
  SESSION_ALREADY_ACTIVE: "You already have an earning session running.",
  SESSION_NOT_FINISHED: "This session hasn't finished yet.",
  NO_ACTIVE_SESSION: "There's no active session to complete.",
  EARNING_DISABLED: "Earning is temporarily paused.",
  MISSION_NOT_FOUND: "That mission is no longer available.",
  MISSION_NOT_CLAIMABLE: "You haven't met this mission's requirement yet.",
  ALREADY_CLAIMED: "You already claimed this mission.",
  FORBIDDEN: "You don't have permission to do that.",
};

export function friendlyError(error: unknown): string {
  const raw =
    typeof error === "string"
      ? error
      : ((error as { message?: string } | null)?.message ?? "Something went wrong.");
  for (const key of Object.keys(FRIENDLY)) {
    if (raw.includes(key)) return FRIENDLY[key] as string;
  }
  return raw.replace(/^.*?:\s*/, "") || "Something went wrong.";
}

export function unwrap<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw new Error(friendlyError(res.error));
  return res.data;
}
