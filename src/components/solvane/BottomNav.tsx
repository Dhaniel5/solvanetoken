import { Link } from "@tanstack/react-router";
import { Home, Zap, Target, Users, Trophy } from "lucide-react";

import { haptic } from "@/integrations/telegram/webapp";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/earn", label: "Earn", icon: Zap },
  { to: "/missions", label: "Missions", icon: Target },
  { to: "/referrals", label: "Invite", icon: Users },
  { to: "/leaderboard", label: "Ranks", icon: Trophy },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 safe-bottom border-t border-border/60 bg-background/95 pt-2 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                onClick={() => haptic("light")}
                activeOptions={{ exact: tab.to === "/" }}
                className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
