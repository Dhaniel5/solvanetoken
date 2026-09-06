import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Zap, Trophy, Users } from "lucide-react";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { levelService, levelProgress } from "@/services/levelService";
import { pointsService } from "@/services/pointsService";
import { userService } from "@/services/userService";
import { earningService } from "@/services/earningService";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Solvane — Earn Solvane Points" },
      {
        name: "description",
        content:
          "Solvane is a participation-driven ecosystem. Run earning sessions, keep streaks, complete missions and climb the leaderboard.",
      },
      { property: "og:title", content: "Solvane — Earn Solvane Points" },
      {
        property: "og:description",
        content: "Participation-driven crypto ecosystem powered by Solvane Points (SVP).",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, userId } = useSolvane();

  const levels = useQuery({
    queryKey: ["levels"],
    queryFn: () => levelService.list(),
    enabled: Boolean(userId),
  });
  const ledger = useQuery({
    queryKey: ["ledger", userId],
    queryFn: () => pointsService.ledger(6),
    enabled: Boolean(userId),
  });
  const rank = useQuery({
    queryKey: ["my-rank", userId],
    queryFn: () => userService.myRank(),
    enabled: Boolean(userId),
  });
  const session = useQuery({
    queryKey: ["active-session", userId],
    queryFn: () => earningService.active(),
    enabled: Boolean(userId),
  });

  const points = profile?.points ?? 0;
  const progress = levelProgress(levels.data ?? [], points);

  return (
    <AppShell>
      <h1 className="sr-only">Solvane dashboard</h1>

      <section className="bg-surface shadow-brand rounded-3xl border border-border/60 p-6">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Solvane Points</p>
        <p className="font-display mt-1 text-4xl font-semibold text-foreground">
          {points.toLocaleString()} <span className="text-brand text-2xl">SVP</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Internal participation points — no monetary value.
        </p>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.current?.name ?? "Explorer"}</span>
            <span>{progress.next ? `${progress.remaining.toLocaleString()} SVP to ${progress.next.name}` : "Max level"}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="bg-brand h-full rounded-full" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-3 gap-3">
        <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${profile?.current_streak ?? 0}d`} />
        <Stat icon={<Trophy className="h-4 w-4" />} label="Rank" value={rank.data ? `#${rank.data}` : "—"} />
        <Stat
          icon={<Zap className="h-4 w-4" />}
          label="Session"
          value={session.data ? "Active" : "Idle"}
        />
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <Link
          to="/earn"
          className="bg-brand shadow-brand rounded-2xl px-4 py-4 text-sm font-semibold text-primary-foreground"
        >
          <Zap className="mb-2 h-5 w-5" />
          {session.data ? "View session" : "Start earning"}
        </Link>
        <Link
          to="/referrals"
          className="rounded-2xl border border-border/60 bg-card px-4 py-4 text-sm font-semibold text-foreground"
        >
          <Users className="mb-2 h-5 w-5 text-accent" />
          Invite friends
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="font-display mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
        {ledger.isLoading ? (
          <LoadingBlock lines={3} />
        ) : (ledger.data?.length ?? 0) === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Complete your first earning session to start your ledger."
          />
        ) : (
          <ul className="space-y-2">
            {ledger.data?.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {entry.description ?? entry.transaction_type.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${entry.amount >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {entry.amount.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card px-3 py-3 text-center">
      <div className="flex justify-center text-primary">{icon}</div>
      <p className="font-display mt-1 text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
