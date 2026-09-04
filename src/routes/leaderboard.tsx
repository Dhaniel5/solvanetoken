import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { leaderboardService, type LeaderboardPeriod } from "@/services/leaderboardService";
import { friendlyError } from "@/services/client";
import { haptic } from "@/integrations/telegram/webapp";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — Solvane" },
      {
        name: "description",
        content: "See the top Solvane participants by points, weekly, monthly and all-time.",
      },
      { property: "og:title", content: "Leaderboard — Solvane" },
      { property: "og:description", content: "Top Solvane participants ranked by Solvane Points." },
    ],
  }),
  component: LeaderboardPage,
});

const PERIODS: Array<{ key: LeaderboardPeriod; label: string }> = [
  { key: "WEEKLY", label: "Week" },
  { key: "MONTHLY", label: "Month" },
  { key: "ALL_TIME", label: "All time" },
];

function LeaderboardPage() {
  const { userId, flags } = useSolvane();
  const [period, setPeriod] = useState<LeaderboardPeriod>("WEEKLY");

  const board = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: () => leaderboardService.get(period, 50),
    enabled: Boolean(userId),
  });

  if (flags["LEADERBOARD_ENABLED"] === false) {
    return (
      <AppShell title="Ranks">
        <EmptyState title="Leaderboard is paused" description="Check back soon." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Ranks">
      <h1 className="font-display text-xl font-semibold text-foreground">Leaderboard</h1>

      <div className="mt-4 flex gap-2 rounded-2xl border border-border/50 bg-card p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              haptic();
              setPeriod(p.key);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
              period === p.key ? "bg-brand text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {board.isLoading ? (
          <LoadingBlock lines={5} />
        ) : board.isError ? (
          <ErrorState message={friendlyError(board.error)} onRetry={() => board.refetch()} />
        ) : (board.data?.length ?? 0) === 0 ? (
          <EmptyState title="No rankings yet" description="Earn points to appear on the board." />
        ) : (
          board.data?.map((row) => (
            <div
              key={`${row.user_id}-${row.rank}`}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                row.user_id === userId
                  ? "border-primary/60 bg-primary/10"
                  : "border-border/50 bg-card"
              }`}
            >
              <span className="font-display w-7 text-sm font-semibold text-muted-foreground">
                {row.rank}
              </span>
              {row.photo_url ? (
                <img src={row.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="bg-brand flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground">
                  {row.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{row.name}</p>
                <p className="text-[11px] text-muted-foreground">Level {row.level}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {Number(row.points).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
