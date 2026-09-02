import { db } from "./client";

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
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async markAllRead() {
    await db.from("notifications").update({ read: true }).eq("read", false);
  },
};
