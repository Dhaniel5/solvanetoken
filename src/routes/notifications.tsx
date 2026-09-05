import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { notificationService } from "@/services/notificationService";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Solvane" },
      { name: "description", content: "Your Solvane activity updates, rewards and mission alerts." },
      { property: "og:title", content: "Notifications — Solvane" },
      { property: "og:description", content: "Activity updates from the Solvane ecosystem." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { userId } = useSolvane();
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => notificationService.list(),
    enabled: Boolean(userId),
  });

  const markRead = useMutation({
    mutationFn: () => notificationService.markAllRead(userId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <AppShell title="Notifications">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-foreground">Notifications</h1>
        <button
          onClick={() => markRead.mutate()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Mark all read
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {list.isLoading ? (
          <LoadingBlock lines={3} />
        ) : (list.data?.length ?? 0) === 0 ? (
          <EmptyState title="Nothing yet" description="Rewards and mission updates will appear here." />
        ) : (
          list.data?.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border px-4 py-3 ${
                n.read ? "border-border/50 bg-card" : "border-primary/40 bg-primary/10"
              }`}
            >
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              {n.body ? <p className="mt-1 text-xs text-muted-foreground">{n.body}</p> : null}
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
