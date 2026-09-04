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
  growth: Array<{ date: string; users: number }>;
  points_series: Array<{ date: string; points: number }>;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  reason: string | null;
  created_at: string;
}

export const adminService = {
  async stats(): Promise<AdminStats> {
    return unwrap<AdminStats>(await db.rpc("admin_stats"));
  },

  async searchUsers(q: string, limit = 50): Promise<Profile[]> {
    return unwrap<Profile[]>(await db.rpc("admin_search_users", { _q: q, _limit: limit })) ?? [];
  },

  async adjustPoints(target: string, amount: number, reason: string) {
    return unwrap(
      await db.rpc("admin_adjust_points", { _target: target, _amount: amount, _reason: reason }),
    );
  },

  async setStatus(target: string, status: string, reason: string) {
    return unwrap(
      await db.rpc("admin_set_status", { _target: target, _status: status, _reason: reason }),
    );
  },

  async auditLogs(limit = 50): Promise<AuditLog[]> {
    return (
      unwrap<AuditLog[]>(
        await db
          .from("admin_audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ) ?? []
    );
  },
};
