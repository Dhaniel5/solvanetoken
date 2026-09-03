import { db, unwrap } from "./client";

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
    return (
      unwrap<Level[]>(
        await db.from("levels").select("*").order("level_number", { ascending: true }),
      ) ?? []
    );
  },
};

export function levelProgress(levels: Level[], points: number) {
  const sorted = [...levels].sort((a, b) => a.level_number - b.level_number);
  let current: Level | undefined = sorted[0];
  let next: Level | undefined;
  for (const level of sorted) {
    if (points >= level.required_points) current = level;
    else {
      next = level;
      break;
    }
  }
  const base = current?.required_points ?? 0;
  const target = next?.required_points ?? base;
  const pct = next ? Math.min(100, Math.round(((points - base) / (target - base || 1)) * 100)) : 100;
  return { current, next, pct, remaining: next ? Math.max(0, target - points) : 0 };
}
