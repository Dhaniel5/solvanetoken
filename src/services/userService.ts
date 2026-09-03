import { db, unwrap } from "./client";

export interface Profile {
  id: string;
  user_id: string;
  telegram_id: number;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  display_name: string | null;
  referral_code: string;
  referred_by: string | null;
  points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  level_number: number;
  status: string;
  onboarded: boolean;
  is_test: boolean;
  created_at: string;
  last_active_at: string | null;
}

export const userService = {
  async me(): Promise<Profile | null> {
    const { data, error } = await db.from("profiles").select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Profile) ?? null;
  },

  async update(patch: Partial<Pick<Profile, "display_name">>, userId: string) {
    return unwrap(await db.from("profiles").update(patch).eq("user_id", userId).select().single());
  },

  async completeOnboarding(userId: string) {
    return unwrap(
      await db.from("profiles").update({ onboarded: true }).eq("user_id", userId).select().single(),
    );
  },

  async myRank(): Promise<number | null> {
    const { data, error } = await db.rpc("my_rank");
    if (error) throw new Error(error.message);
    return (data as number) ?? null;
  },

  async isAdmin(userId: string): Promise<boolean> {
    const { data, error } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (error) return false;
    return Boolean(data);
  },
};
