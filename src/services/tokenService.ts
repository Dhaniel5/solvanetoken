import { db, unwrap } from "./client";

export interface TokenConfig {
  id: string;
  token_name: string;
  symbol: string;
  blockchain: string | null;
  contract_address: string | null;
  decimals: number;
  status: string;
}

/**
 * $SVNE is not launched. This service only reads the placeholder configuration
 * row; it never reports balances, conversions, or monetary value.
 */
export const tokenService = {
  async config(): Promise<TokenConfig | null> {
    const { data, error } = await db.from("token_config").select("*").limit(1).maybeSingle();
    if (error) return null;
    return (data as TokenConfig) ?? null;
  },

  async conversionRules() {
    return unwrap<Array<{ id: string; status: string }>>(
      await db.from("conversion_rules").select("*"),
    ) ?? [];
  },
};
