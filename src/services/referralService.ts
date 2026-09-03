import { db, unwrap } from "./client";

export interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  qualified_at: string | null;
  rewarded_at: string | null;
  created_at: string;
}

export const referralService = {
  async mine(profileId: string): Promise<ReferralRow[]> {
    return (
      unwrap<ReferralRow[]>(
        await db
          .from("referrals")
          .select("*")
          .eq("referrer_id", profileId)
          .order("created_at", { ascending: false }),
      ) ?? []
    );
  },

  async apply(code: string): Promise<{ ok: boolean; reason?: string }> {
    return unwrap(await db.rpc("apply_referral", { _code: code }));
  },
};
