import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { missionService } from "@/services/missionService";
import { friendlyError } from "@/services/client";
import { hapticNotify } from "@/integrations/telegram/webapp";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Missions — Solvane" },
      {
        name: "description",
        content: "Complete daily and milestone missions to earn bonus Solvane Points.",
      },
      { property: "og:title", content: "Missions — Solvane" },
      { property: "og:description", content: "Daily and milestone missions in the Solvane ecosystem." },
    ],
  }),
  component: MissionsPage,
});

function MissionsPage() {
  const { userId, flags } = useSolvane();
  const queryClient = useQueryClient();

  const missions = useQuery({
    queryKey: ["missions", userId],
    queryFn: () => missionService.list(),
    enabled: Boolean(userId),
  });

  const claim = useMutation({
    mutationFn: (id: string) => missionService.claim(id),
    onSuccess: (res) => {
      hapticNotify("success");
      toast.success(`+${res.reward.toLocaleString()} SVP claimed`);
      void queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  if (flags["MISSIONS_ENABLED"] === false) {
    return (
      <AppShell title="Missions">
        <EmptyState title="Missions are paused" description="Check back soon." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Missions">
      <h1 className="font-display text-xl font-semibold text-foreground">Missions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Progress updates automatically as you participate.
      </p>

      <div className="mt-5 space-y-3">
        {missions.isLoading ? (
          <LoadingBlock lines={4} />
        ) : missions.isError ? (
          <ErrorState message={friendlyError(missions.error)} onRetry={() => missions.refetch()} />
        ) : (missions.data?.length ?? 0) === 0 ? (
          <EmptyState title="No active missions" description="New missions are added regularly." />
        ) : (
          missions.data?.map((mission) => {
            const pct = Math.min(100, Math.round((mission.progress / (mission.requirement || 1)) * 100));
            return (
              <article
                key={mission.id}
                className="rounded-2xl border border-border/50 bg-card px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{mission.title}</h2>
                    {mission.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{mission.description}</p>
                    ) : null}
                  </div>
                  <span className="text-brand text-sm font-semibold whitespace-nowrap">
                    +{mission.reward_points}
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="bg-brand h-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {mission.progress}/{mission.requirement}
                  </span>
                  <button
                    disabled={!mission.claimable || claim.isPending}
                    onClick={() => claim.mutate(mission.id)}
                    className="bg-brand rounded-full px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:bg-none disabled:bg-muted disabled:text-muted-foreground"
                  >
                    {mission.claimed ? "Claimed" : mission.claimable ? "Claim" : "In progress"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
