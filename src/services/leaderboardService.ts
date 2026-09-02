import { db } from "./client";

export type LeaderboardPeriod = "ALL" | "WEEKLY" | "MONTHLY";

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  name: string;
  username: string | null;
  photo_url: string | null;
  level: number;
  points: number;
}

export const leaderboardService = {
  async get(period: LeaderboardPeriod, page = 0, pageSize = 25): Promise<LeaderboardRow[]> {
    const { data, error } = await db.rpc("get_leaderboard", {
      _period: period,
      _limit: pageSize,
      _offset: page * pageSize,
    });
    if (error) throw new Error(error.message);
    return (data ?? []) as LeaderboardRow[];
  },
};
