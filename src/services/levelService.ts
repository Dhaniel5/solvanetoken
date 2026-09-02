import { db } from "./client";

export interface Level {
  id: string;
  level_number: number;
  name: string;
  required_points: number;
  multiplier: number;
  badge: string | null;
  benefits: string | null;
}

export const levelService = {
  async list(): Promise<Level[]> {
    const { data, error } = await db.from("levels").select("*").order("level_number");
    if (error) throw new Error(error.message);
    return data ?? [];
  },
};

export function levelProgress(levels: Level[], points: number) {
  const sorted = [...levels].sort((a, b) => a.level_number - b.level_number);
  const current = [...sorted].reverse().find((l) => points >= l.required_points) ?? sorted[0];
  const next = sorted.find((l) => l.level_number === (current?.level_number ?? 1) + 1);
  const floor = current?.required_points ?? 0;
  const ceiling = next?.required_points ?? floor;
  const pct = next ? Math.min(100, Math.round(((points - floor) / Math.max(ceiling - floor, 1)) * 100)) : 100;
  return { current, next, pct, remaining: next ? Math.max(ceiling - points, 0) : 0 };
}
