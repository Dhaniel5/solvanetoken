import { db, unwrap } from "./client";

export interface Wallet {
  id: string;
  blockchain: string;
  wallet_address: string;
  wallet_type: string | null;
  verified: boolean;
  primary_wallet: boolean;
}

/** Wallet linking is disabled for the MVP — read-only placeholder. */
export const walletService = {
  async list(): Promise<Wallet[]> {
    return unwrap<Wallet[]>(await db.from("user_wallets").select("*")) ?? [];
  },
};
