import { db, unwrap } from "./client";

export interface EarningSession {
  id: string;
  user_id: string;
  started_at: string;
  expected_end_at: string;
  ended_at: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  base_rate: number;
  multiplier: number;
  points_accrued: number;
}

export interface SessionResult {
  earned: number;
  streak: number;
  balance: number;
  session_id: string;
}

export const earningService = {
  async getActiveSession(): Promise<EarningSession | null> {
    const { data, error } = await db
      .from("earning_sessions")
      .select("*")
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async getRecentSessions(limit = 10): Promise<EarningSession[]> {
    const { data, error } = await db
      .from("earning_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async start(): Promise<EarningSession> {
    return unwrap(await db.rpc("start_earning_session"));
  },

  async complete(): Promise<SessionResult> {
    return unwrap(await db.rpc("complete_earning_session"));
  },
};
