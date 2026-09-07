import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { earningService } from "@/services/earningService";
import { friendlyError } from "@/services/client";
import { hapticNotify } from "@/integrations/telegram/webapp";

export const Route = createFileRoute("/earn")({
  head: () => ({
    meta: [
      { title: "Earning sessions — Solvane" },
      {
        name: "description",
        content: "Run a Solvane earning session and accrue SVP with streak and level multipliers.",
      },
      { property: "og:title", content: "Earning sessions — Solvane" },
      { property: "og:description", content: "Accrue Solvane Points through timed earning sessions." },
    ],
  }),
  component: EarnPage,
});

function useCountdown(target: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target) return null;
  return Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function EarnPage() {
  const { userId, flags } = useSolvane();
  const queryClient = useQueryClient();

  const session = useQuery({
    queryKey: ["active-session", userId],
    queryFn: () => earningService.active(),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });

  const history = useQuery({
    queryKey: ["sessions", userId],
    queryFn: () => earningService.recent(8),
    enabled: Boolean(userId),
  });

  const remaining = useCountdown(session.data?.expected_end_at);

  const invalidate = () => {
    void queryClient.invalidateQueries();
  };

  const start = useMutation({
    mutationFn: () => earningService.start(),
    onSuccess: () => {
      hapticNotify("success");
      toast.success("Earning session started");
      invalidate();
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const complete = useMutation({
    mutationFn: () => earningService.complete(),
    onSuccess: (result) => {
      hapticNotify("success");
      toast.success(`+${result.earned.toLocaleString()} SVP claimed`);
      invalidate();
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const earningEnabled = flags["EARNING_ENABLED"] !== false;
  const active = session.data;
  const finished = active ? remaining === 0 : false;

  const accrued = (() => {
    if (!active) return 0;
    const start = new Date(active.started_at).getTime();
    const end = new Date(active.expected_end_at).getTime();
    const elapsed = Math.max(0, Math.min(Date.now(), end) - start) / 3_600_000;
    return Math.floor(Number(active.base_rate) * Number(active.multiplier) * elapsed);
  })();

  return (
    <AppShell title="Earn">
      <h1 className="font-display text-xl font-semibold text-foreground">Earning session</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sessions accrue SVP over time. Your streak and level set the multiplier.
      </p>

      {!earningEnabled ? (
        <div className="mt-5">
          <EmptyState title="Earning is paused" description="Sessions are temporarily disabled." />
        </div>
      ) : session.isLoading ? (
        <div className="mt-5">
          <LoadingBlock lines={2} />
        </div>
      ) : session.isError ? (
        <div className="mt-5">
          <ErrorState message={friendlyError(session.error)} onRetry={() => session.refetch()} />
        </div>
      ) : (
        <section className="bg-surface shadow-brand mt-5 rounded-3xl border border-border/60 p-6 text-center">
          {active ? (
            <>
              <p className="text-xs tracking-widest text-muted-foreground uppercase">
                {finished ? "Session complete" : "Time remaining"}
              </p>
              <p className="font-display mt-2 text-4xl font-semibold text-foreground">
                {formatDuration(remaining ?? 0)}
              </p>
              <p className="mt-3 text-sm font-semibold text-success">
                {accrued.toLocaleString()} SVP earned so far
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {Number(active.base_rate)} SVP/hour × {Number(active.multiplier).toFixed(2)} multiplier
              </p>
              <button
                disabled={complete.isPending}
                onClick={() => complete.mutate()}
                className="bg-brand mt-6 w-full rounded-2xl py-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {complete.isPending
                  ? "Claiming…"
                  : finished
                    ? "Claim rewards"
                    : `Claim ${accrued.toLocaleString()} SVP now`}
              </button>
              {!finished && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Claim any time — or wait for the full session to earn the maximum.
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">No session running.</p>
              <button
                disabled={start.isPending}
                onClick={() => start.mutate()}
                className="bg-brand shadow-brand mt-5 w-full rounded-2xl py-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {start.isPending ? "Starting…" : "Start earning session"}
              </button>
            </>
          )}
        </section>
      )}


      <section className="mt-6">
        <h2 className="font-display mb-3 text-sm font-semibold text-foreground">Session history</h2>
        {history.isLoading ? (
          <LoadingBlock lines={2} />
        ) : (history.data?.length ?? 0) === 0 ? (
          <EmptyState title="No sessions yet" description="Your completed sessions will show here." />
        ) : (
          <ul className="space-y-2">
            {history.data?.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3"
              >
                <div>
                  <p className="text-sm text-foreground">{s.status.toLowerCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.started_at).toLocaleString()}
                  </p>
                </div>
                <span className="text-sm font-semibold text-success">
                  +{Number(s.points_accrued).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
