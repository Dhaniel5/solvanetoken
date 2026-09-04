import { db, unwrap } from "./client";

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string | null;
}

export const achievementService = {
  async list(): Promise<Achievement[]> {
    const all =
      unwrap<Array<Omit<Achievement, "unlocked_at">>>(
        await db.from("achievements").select("*").order("created_at", { ascending: true }),
      ) ?? [];
    const mine =
      unwrap<Array<{ achievement_id: string; unlocked_at: string }>>(
        await db.from("user_achievements").select("achievement_id, unlocked_at"),
      ) ?? [];
    const map = new Map(mine.map((row) => [row.achievement_id, row.unlocked_at]));
    return all.map((a) => ({ ...a, unlocked_at: map.get(a.id) ?? null }));
  },
};
