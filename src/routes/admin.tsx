import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, ErrorState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { adminService } from "@/services/adminService";
import { configService } from "@/services/configService";
import { friendlyError } from "@/services/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Solvane" },
      { name: "description", content: "Solvane admin panel: users, points, missions and flags." },
      { property: "og:title", content: "Admin — Solvane" },
      { property: "og:description", content: "Operational controls for the Solvane ecosystem." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Overview", "Users", "Flags", "Audit"] as const;

function AdminPage() {
  const { isAdmin, userId } = useSolvane();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");

  if (userId && !isAdmin) {
    return (
      <AppShell title="Admin">
        <EmptyState title="Admins only" description="You don't have access to this area." />
      </AppShell>
    );
  }

  return (
    <AppShell title="Admin">
      <h1 className="font-display text-xl font-semibold text-foreground">Admin panel</h1>
      <div className="mt-4 flex gap-1 rounded-2xl border border-border/50 bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium ${
              tab === t ? "bg-brand text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "Overview" ? <Overview /> : null}
        {tab === "Users" ? <Users /> : null}
        {tab === "Flags" ? <Flags /> : null}
        {tab === "Audit" ? <Audit /> : null}
      </div>
    </AppShell>
  );
}

function Overview() {
  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => adminService.stats() });
  if (stats.isLoading) return <LoadingBlock lines={3} />;
  if (stats.isError)
    return <ErrorState message={friendlyError(stats.error)} onRetry={() => stats.refetch()} />;
  const s = stats.data;
  const cells: Array<[string, number]> = [
    ["Total users", s?.total_users ?? 0],
    ["Active today", s?.dau ?? 0],
    ["Flagged", s?.flagged_users ?? 0],
    ["Points issued", s?.total_points ?? 0],
    ["Points today", s?.points_today ?? 0],
    ["Active sessions", s?.active_sessions ?? 0],
    ["Referrals", s?.total_referrals ?? 0],
    ["Qualified refs", s?.qualified_referrals ?? 0],
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cells.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-border/50 bg-card px-4 py-4">
          <p className="font-display text-xl font-semibold text-foreground">
            {Number(value).toLocaleString()}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users", q], queryFn: () => adminService.searchUsers(q) });

  const adjust = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      adminService.adjustPoints(id, amount, "Manual admin adjustment"),
    onSuccess: () => {
      toast.success("Points adjusted");
      void queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      adminService.setStatus(id, next, "Manual admin status change"),
    onSuccess: () => {
      toast.success("Status updated");
      void queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search username, name or code"
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      />
      <div className="mt-3 space-y-2">
        {users.isLoading ? (
          <LoadingBlock lines={3} />
        ) : (users.data?.length ?? 0) === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          users.data?.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border/50 bg-card px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">
                    {u.display_name ?? u.first_name ?? u.telegram_username ?? "Solvaner"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {u.points.toLocaleString()} SVP · {u.status} · L{u.level_number}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => adjust.mutate({ id: u.user_id, amount: 100 })}
                  className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-foreground"
                >
                  +100 SVP
                </button>
                <button
                  onClick={() => adjust.mutate({ id: u.user_id, amount: -100 })}
                  className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-foreground"
                >
                  -100 SVP
                </button>
                <button
                  onClick={() =>
                    status.mutate({ id: u.user_id, next: u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" })
                  }
                  className="rounded-full border border-destructive/50 px-3 py-1 text-[11px] text-destructive"
                >
                  {u.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Flags() {
  const queryClient = useQueryClient();
  const flags = useQuery({ queryKey: ["admin-flags"], queryFn: () => configService.flagRows() });
  const toggle = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      configService.setFlag(key, enabled),
    onSuccess: () => {
      toast.success("Flag updated");
      void queryClient.invalidateQueries();
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  if (flags.isLoading) return <LoadingBlock lines={3} />;
  return (
    <div className="space-y-2">
      {flags.data?.map((flag) => (
        <div
          key={flag.key}
          className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3"
        >
          <div className="min-w-0 pr-3">
            <p className="text-sm text-foreground">{flag.key}</p>
            {flag.description ? (
              <p className="text-[11px] text-muted-foreground">{flag.description}</p>
            ) : null}
          </div>
          <button
            onClick={() => toggle.mutate({ key: flag.key, enabled: !flag.enabled })}
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              flag.enabled ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {flag.enabled ? "On" : "Off"}
          </button>
        </div>
      ))}
    </div>
  );
}

function Audit() {
  const logs = useQuery({ queryKey: ["admin-audit"], queryFn: () => adminService.auditLogs() });
  if (logs.isLoading) return <LoadingBlock lines={3} />;
  if ((logs.data?.length ?? 0) === 0) return <EmptyState title="No admin actions logged yet" />;
  return (
    <ul className="space-y-2">
      {logs.data?.map((log) => (
        <li key={log.id} className="rounded-2xl border border-border/50 bg-card px-4 py-3">
          <p className="text-sm text-foreground">{log.action}</p>
          <p className="text-[11px] text-muted-foreground">
            {log.reason ?? "—"} · {new Date(log.created_at).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
