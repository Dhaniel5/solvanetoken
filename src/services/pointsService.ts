import { db } from "./client";

export interface LedgerEntry {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export const pointsService = {
  async getLedger(limit = 30): Promise<LedgerEntry[]> {
    const { data, error } = await db
      .from("points_ledger")
      .select("id, amount, transaction_type, description, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
