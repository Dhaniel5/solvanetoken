import { db, unwrap } from "./client";

export type LeaderboardPeriod = "ALL_TIME" | "WEEKLY" | "MONTHLY";

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
  async get(period: LeaderboardPeriod, limit = 50, offset = 0): Promise<LeaderboardRow[]> {
    return (
      unwrap<LeaderboardRow[]>(
        await db.rpc("get_leaderboard", { _period: period, _limit: limit, _offset: offset }),
      ) ?? []
    );
  },
};
