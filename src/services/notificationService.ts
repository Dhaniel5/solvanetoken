import { db, unwrap } from "./client";

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  read: boolean;
  created_at: string;
}

export const notificationService = {
  async list(limit = 30): Promise<Notification[]> {
    return (
      unwrap<Notification[]>(
        await db
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit),
      ) ?? []
    );
  },

  async markAllRead(userId: string) {
    return unwrap(
      await db.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false),
    );
  },
};
