import { db, unwrap } from "./client";

export interface Referral {
  id: string;
  status: "INVITED" | "REGISTERED" | "QUALIFIED" | "REWARDED" | "FLAGGED";
  created_at: string;
  qualified_at: string | null;
  rewarded_at: string | null;
}

export interface ReferralStats {
  registered: number;
  qualified: number;
  rewarded: number;
  rewardPoints: number;
  history: Referral[];
}

export const referralService = {
  async getStats(): Promise<ReferralStats> {
    const { data, error } = await db
      .from("referrals")
      .select("id, status, created_at, qualified_at, rewarded_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    const history = (data ?? []) as Referral[];

    const { data: rewards } = await db
      .from("points_ledger")
      .select("amount")
      .eq("transaction_type", "REFERRAL_REWARD");

    return {
      registered: history.length,
      qualified: history.filter((r) => r.status === "QUALIFIED" || r.status === "REWARDED").length,
      rewarded: history.filter((r) => r.status === "REWARDED").length,
      rewardPoints: (rewards ?? []).reduce((sum: number, r: { amount: number }) => sum + r.amount, 0),
      history,
    };
  },

  async applyCode(code: string): Promise<{ ok: boolean; reason?: string }> {
    return unwrap(await db.rpc("apply_referral", { _code: code }));
  },
};
