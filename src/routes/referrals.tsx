import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { referralService } from "@/services/referralService";
import { referralLink, shareReferral, haptic } from "@/integrations/telegram/webapp";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Invite friends — Solvane" },
      {
        name: "description",
        content: "Share your Solvane referral link and earn SVP when invites qualify through activity.",
      },
      { property: "og:title", content: "Invite friends — Solvane" },
      { property: "og:description", content: "Grow the Solvane network and earn referral rewards." },
    ],
  }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const { profile, flags } = useSolvane();

  const referrals = useQuery({
    queryKey: ["referrals", profile?.id],
    queryFn: () => referralService.mine(profile?.id as string),
    enabled: Boolean(profile?.id),
  });

  if (flags["REFERRALS_ENABLED"] === false) {
    return (
      <AppShell title="Invite">
        <EmptyState title="Referrals are paused" description="Check back soon." />
      </AppShell>
    );
  }

  const code = profile?.referral_code ?? "";
  const link = code ? referralLink(code) : "";
  const qualified = referrals.data?.filter((r) => r.status === "QUALIFIED" || r.status === "REWARDED").length ?? 0;

  return (
    <AppShell title="Invite">
      <h1 className="font-display text-xl font-semibold text-foreground">Invite friends</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You're rewarded once an invite qualifies by completing real activity.
      </p>

      <section className="bg-surface shadow-brand mt-5 rounded-3xl border border-border/60 p-6">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Your code</p>
        <p className="font-display mt-1 text-2xl font-semibold tracking-wide text-foreground">{code || "—"}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              haptic();
              void navigator.clipboard.writeText(link);
              toast.success("Referral link copied");
            }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card py-3 text-sm font-medium text-foreground"
          >
            <Copy className="h-4 w-4" /> Copy link
          </button>
          <button
            onClick={() => {
              haptic();
              shareReferral(code);
            }}
            className="bg-brand flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary-foreground"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-4 text-center">
          <p className="font-display text-2xl font-semibold text-foreground">
            {referrals.data?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">Invited</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card px-4 py-4 text-center">
          <p className="font-display text-2xl font-semibold text-success">{qualified}</p>
          <p className="text-xs text-muted-foreground">Qualified</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display mb-3 text-sm font-semibold text-foreground">Your referrals</h2>
        {referrals.isLoading ? (
          <LoadingBlock lines={2} />
        ) : (referrals.data?.length ?? 0) === 0 ? (
          <EmptyState title="No referrals yet" description="Share your link to get started." />
        ) : (
          <ul className="space-y-2">
            {referrals.data?.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-border/50 bg-card px-4 py-3"
              >
                <span className="text-sm text-foreground">
                  Joined {new Date(r.created_at).toLocaleDateString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">{r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
