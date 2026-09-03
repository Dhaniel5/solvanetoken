import { unwrap, db } from "./client";

export interface LedgerEntry {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export const pointsService = {
  async ledger(limit = 25): Promise<LedgerEntry[]> {
    return (
      unwrap<LedgerEntry[]>(
        await db
          .from("points_ledger")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ) ?? []
    );
  },
};
