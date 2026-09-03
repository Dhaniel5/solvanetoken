import { db, unwrap } from "./client";

export interface EarningSession {
  id: string;
  user_id: string;
  started_at: string;
  expected_end_at: string;
  ended_at: string | null;
  status: string;
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
  async active(): Promise<EarningSession | null> {
    const { data, error } = await db
      .from("earning_sessions")
      .select("*")
      .eq("status", "ACTIVE")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as EarningSession) ?? null;
  },

  async recent(limit = 10): Promise<EarningSession[]> {
    return (
      unwrap<EarningSession[]>(
        await db
          .from("earning_sessions")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(limit),
      ) ?? []
    );
  },

  async start(): Promise<EarningSession> {
    return unwrap<EarningSession>(await db.rpc("start_earning_session"));
  },

  async complete(): Promise<SessionResult> {
    return unwrap<SessionResult>(await db.rpc("complete_earning_session"));
  },
};
