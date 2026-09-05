import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/solvane/AppShell";
import { EmptyState, LoadingBlock } from "@/components/solvane/States";
import { useSolvane } from "@/hooks/useSolvane";
import { userService } from "@/services/userService";
import { achievementService } from "@/services/achievementService";
import { levelService, levelProgress } from "@/services/levelService";
import { friendlyError } from "@/services/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — Solvane" },
      {
        name: "description",
        content: "Your Solvane profile: level, streaks, achievements and account details.",
      },
      { property: "og:title", content: "Your profile — Solvane" },
      { property: "og:description", content: "Level, streaks and achievements in Solvane." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, userId, flags, inTelegram } = useSolvane();
  const queryClient = useQueryClient();
  const [name, setName] = useState<string | null>(null);

  const levels = useQuery({ queryKey: ["levels"], queryFn: () => levelService.list() });
  const achievements = useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => achievementService.list(),
    enabled: Boolean(userId) && flags["ACHIEVEMENTS_ENABLED"] !== false,
  });

  const save = useMutation({
    mutationFn: (displayName: string) =>
      userService.update({ display_name: displayName }, userId as string),
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(friendlyError(err)),
  });

  const progress = levelProgress(levels.data ?? [], profile?.points ?? 0);
  const value = name ?? profile?.display_name ?? profile?.first_name ?? "";

  return (
    <AppShell title="Profile">
      <h1 className="font-display text-xl font-semibold text-foreground">Your profile</h1>

      <section className="bg-surface mt-4 rounded-3xl border border-border/60 p-6">
        <div className="flex items-center gap-4">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="h-14 w-14 rounded-2xl object-cover" />
          ) : (
            <span className="bg-brand flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold text-primary-foreground">
              {(value || "S").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="font-display text-lg font-semibold text-foreground">{value || "Solvaner"}</p>
            <p className="text-xs text-muted-foreground">
              {profile?.telegram_username ? `@${profile.telegram_username}` : "Telegram account"}
              {profile?.is_test ? " · test account" : ""}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <Cell label="Level" value={`${progress.current?.name ?? "Explorer"}`} />
          <Cell label="Streak" value={`${profile?.current_streak ?? 0}d`} />
          <Cell label="Best" value={`${profile?.longest_streak ?? 0}d`} />
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-border/50 bg-card p-4">
        <label htmlFor="display-name" className="text-xs text-muted-foreground">
          Display name
        </label>
        <input
          id="display-name"
          value={value}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <button
          disabled={save.isPending || !value.trim()}
          onClick={() => save.mutate(value.trim())}
          className="bg-brand mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </section>

      <section className="mt-6">
        <h2 className="font-display mb-3 text-sm font-semibold text-foreground">Achievements</h2>
        {flags["ACHIEVEMENTS_ENABLED"] === false ? (
          <EmptyState title="Achievements are paused" />
        ) : achievements.isLoading ? (
          <LoadingBlock lines={2} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {achievements.data?.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl border px-4 py-4 ${
                  a.unlocked_at ? "border-primary/50 bg-primary/10" : "border-border/50 bg-card opacity-60"
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border/50 bg-card p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-semibold text-foreground">$SVNE — coming later</h2>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Solvane Points are internal participation points with no monetary value. Wallet linking,
          token claims and any conversion are not available and stay disabled until the token
          launches.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Wallet", "Token claim", "Conversion"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-border/60 px-3 py-1 text-[11px] text-muted-foreground"
            >
              {item} · disabled
            </span>
          ))}
        </div>
      </section>

      {!inTelegram ? (
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Browser test mode — open the app inside Telegram for the full experience.
        </p>
      ) : null}
    </AppShell>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card px-2 py-3">
      <p className="font-display text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
