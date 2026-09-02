import { db, unwrap } from "./client";

export interface Profile {
  id: string;
  user_id: string;
  telegram_id: number | null;
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
  level_number: number;
  status: string;
  onboarded: boolean;
  is_test: boolean;
  created_at: string;
  last_active_at: string;
}

export const userService = {
  async getProfile(): Promise<Profile | null> {
    const { data, error } = await db.from("profiles").select("*").maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  async updateProfile(patch: { display_name?: string | null }) {
    return unwrap(await db.from("profiles").update(patch).select().single());
  },

  async completeOnboarding() {
    return unwrap(await db.from("profiles").update({ onboarded: true }).select().single());
  },

  async getRank(): Promise<number> {
    const { data, error } = await db.rpc("my_rank");
    if (error) throw new Error(error.message);
    return Number(data ?? 0);
  },

  async isAdmin(userId: string): Promise<boolean> {
    const { data } = await db.rpc("has_role", { _user_id: userId, _role: "admin" });
    return Boolean(data);
  },
};
