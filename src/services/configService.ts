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
  async flags(): Promise<Record<string, boolean>> {
    const { data, error } = await db.from("feature_flags").select("key, enabled");
    if (error) throw new Error(error.message);
    return Object.fromEntries((data ?? []).map((f: FeatureFlag) => [f.key, f.enabled]));
  },

  async flagRows(): Promise<FeatureFlag[]> {
    const { data, error } = await db.from("feature_flags").select("*").order("key");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async setFlag(key: string, enabled: boolean) {
    return unwrap(await db.from("feature_flags").update({ enabled }).eq("key", key).select().single());
  },

  async settings(): Promise<EconomySetting[]> {
    const { data, error } = await db.from("economy_settings").select("*").order("key");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async setSetting(key: string, value: unknown) {
    return unwrap(
      await db.from("economy_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key).select().single(),
    );
  },
};
