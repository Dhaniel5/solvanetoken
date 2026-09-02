import { supabase } from "@/integrations/supabase/client";

/**
 * Loosely-typed access point for the generated Supabase client.
 * Services own all data access; components never query the database directly.
 */
export const db = supabase as unknown as {
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data: any; error: any }>;
  auth: (typeof supabase)["auth"];
};

export function unwrap<T>({ data, error }: { data: T; error: { message?: string } | null }): T {
  if (error) throw new Error(friendlyError(error.message));
  return data;
}

const MESSAGES: Record<string, string> = {
  SESSION_ALREADY_ACTIVE: "You already have an earning session running.",
  SESSION_NOT_FINISHED: "This session isn't finished yet.",
  NO_ACTIVE_SESSION: "There's no active earning session.",
  EARNING_DISABLED: "Earning is temporarily paused.",
  ACCOUNT_NOT_ACTIVE: "Your account is not active. Contact support.",
  MISSION_NOT_CLAIMABLE: "This mission isn't ready to claim yet.",
  ALREADY_CLAIMED: "You've already claimed this reward.",
  FORBIDDEN: "You don't have access to this.",
  NOT_AUTHENTICATED: "Please reopen Solvane to continue.",
};

export function friendlyError(raw?: string) {
  if (!raw) return "Something went wrong. Try again.";
  const match = Object.keys(MESSAGES).find((key) => raw.includes(key));
  return match ? MESSAGES[match] : "Something went wrong. Try again.";
}
