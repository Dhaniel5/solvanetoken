import { db } from "./client";

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  icon: string | null;
  unlocked_at?: string | null;
}

export const achievementService = {
  async listWithProgress(): Promise<Achievement[]> {
    const [{ data: all, error }, { data: mine }] = await Promise.all([
      db.from("achievements").select("*").order("code"),
      db.from("user_achievements").select("achievement_id, unlocked_at"),
    ]);
    if (error) throw new Error(error.message);
    const unlocked = new Map<string, string>(
      (mine ?? []).map((row: { achievement_id: string; unlocked_at: string }) => [
        row.achievement_id,
        row.unlocked_at,
      ]),
    );
    return (all ?? []).map((a: Achievement) => ({ ...a, unlocked_at: unlocked.get(a.id) ?? null }));
  },
};
