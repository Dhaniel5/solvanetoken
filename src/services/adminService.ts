import { db, unwrap } from "./client";
import type { Profile } from "./userService";

export interface AdminStats {
  total_users: number;
  active_users: number;
  dau: number;
  flagged_users: number;
  total_points: number;
  points_today: number;
  active_sessions: number;
  completed_sessions: number;
  total_referrals: number;
  qualified_referrals: number;
  missions_completed: number;
  growth: { date: string; users: number }[];
  points_series: { date: string; points: number }[];
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  previous_value: unknown;
  new_value: unknown;
  reason: string | null;
  created_at: string;
}

export const adminService = {
  async stats(): Promise<AdminStats> {
    const { data, error } = await db.rpc("admin_stats");
    if (error) throw new Error(error.message);
    return data as AdminStats;
  },

  async searchUsers(query = ""): Promise<Profile[]> {
    const { data, error } = await db.rpc("admin_search_users", { _q: query, _limit: 100 });
    if (error) throw new Error(error.message);
    return (data ?? []) as Profile[];
  },

  async adjustPoints(userId: string, amount: number, reason: string) {
    return unwrap(await db.rpc("admin_adjust_points", { _target: userId, _amount: amount, _reason: reason }));
  },

  async setStatus(userId: string, status: "ACTIVE" | "SUSPENDED" | "FLAGGED", reason: string) {
    return unwrap(await db.rpc("admin_set_status", { _target: userId, _status: status, _reason: reason }));
  },

  async auditLogs(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await db
      .from("admin_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async sessions(limit = 50) {
    const { data, error } = await db
      .from("earning_sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async referrals(limit = 100) {
    const { data, error } = await db
      .from("referrals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async missions() {
    const { data, error } = await db.from("missions").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async updateMission(id: string, patch: Record<string, unknown>) {
    return unwrap(await db.from("missions").update(patch).eq("id", id).select().single());
  },
};
