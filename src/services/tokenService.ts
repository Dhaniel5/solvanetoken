import { db } from "./client";

export interface TokenConfig {
  token_name: string;
  symbol: string;
  blockchain: string | null;
  contract_address: string | null;
  decimals: number | null;
  status: "NOT_LAUNCHED" | "ANNOUNCED" | "LIVE";
}

/**
 * $SVNE is not launched. This service only reads configuration state so the
 * UI can present the token as "coming later" — it never simulates balances.
 */
export const tokenService = {
  async getConfig(): Promise<TokenConfig | null> {
    const { data, error } = await db.from("token_config").select("*").limit(1).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },
};
