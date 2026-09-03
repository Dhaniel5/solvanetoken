import { db, unwrap } from "./client";

export interface MissionState {
  id: string;
  code: string;
  title: string;
  description: string | null;
  reward_points: number;
  requirement: number;
  progress: number;
  claimed: boolean;
  claimable: boolean;
}

export const missionService = {
  async list(): Promise<MissionState[]> {
    return unwrap<MissionState[]>(await db.rpc("mission_state")) ?? [];
  },

  async claim(missionId: string): Promise<{ reward: number; balance: number }> {
    return unwrap(await db.rpc("claim_mission", { _mission_id: missionId }));
  },
};
