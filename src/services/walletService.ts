import { db } from "./client";

export interface UserWallet {
  id: string;
  blockchain: string;
  wallet_address: string;
  wallet_type: string | null;
  verified: boolean;
  primary_wallet: boolean;
}

/**
 * Wallet connection is intentionally disabled for the MVP (WALLET_ENABLED
 * feature flag). The structure exists so Solana wallets can be added later.
 */
export const walletService = {
  async list(): Promise<UserWallet[]> {
    const { data, error } = await db.from("user_wallets").select("*");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};
