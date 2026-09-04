import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell, ShieldCheck, User } from "lucide-react";
import type { ReactNode } from "react";

import { useSolvane } from "@/hooks/useSolvane";
import { userService } from "@/services/userService";
import { BottomNav } from "./BottomNav";
import { ErrorState } from "./States";
import { Onboarding } from "./Onboarding";

export const LOGO_URL = "/__l5e/assets-v1/8fb41a1b-4c6d-4a9b-9479-a2e258d43e0e/solvane-logo.png";

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <img
        src={LOGO_URL}
        alt="Solvane"
        className="animate-solvane-pulse h-20 w-20 rounded-2xl"
      />
      <p className="text-sm text-muted-foreground">Connecting you to Solvane…</p>
    </div>
  );
}

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const { status, error, retry, profile, userId, isAdmin } = useSolvane();
  const queryClient = useQueryClient();

  const finishOnboarding = useMutation({
    mutationFn: () => userService.completeOnboarding(userId as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  if (status === "loading") return <Splash />;
  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <ErrorState message={error ?? "We couldn't sign you in."} onRetry={retry} />
      </div>
    );
  }
  if (profile && !profile.onboarded) {
    return <Onboarding busy={finishOnboarding.isPending} onFinish={() => finishOnboarding.mutate()} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="safe-top sticky top-0 z-30 border-b border-border/50 bg-background/90 px-5 pb-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-display text-base font-semibold text-foreground">
              {title ?? "Solvane"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link
                to="/admin"
                className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Admin panel"
              >
                <ShieldCheck className="h-5 w-5" />
              </Link>
            ) : null}
            <Link
              to="/notifications"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              to="/profile"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Profile"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}
