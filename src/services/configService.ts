import { db, unwrap } from "./client";

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

export interface EconomySetting {
  key: string;
  value: unknown;
  description: string | null;
}

export const configService = {
  async flagRows(): Promise<FeatureFlag[]> {
    return unwrap<FeatureFlag[]>(await db.from("feature_flags").select("*").order("key")) ?? [];
  },

  async flags(): Promise<Record<string, boolean>> {
    const rows = await configService.flagRows();
    return Object.fromEntries(rows.map((row) => [row.key, row.enabled]));
  },

  async setFlag(key: string, enabled: boolean) {
    return unwrap(await db.from("feature_flags").update({ enabled }).eq("key", key));
  },

  async settings(): Promise<EconomySetting[]> {
    return unwrap<EconomySetting[]>(await db.from("economy_settings").select("*").order("key")) ?? [];
  },

  async setSetting(key: string, value: unknown) {
    return unwrap(await db.from("economy_settings").update({ value }).eq("key", key));
  },
};
