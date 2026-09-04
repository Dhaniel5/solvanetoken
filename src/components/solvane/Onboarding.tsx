import { useState } from "react";
import { Sparkles, Zap, Target, Users, ShieldCheck } from "lucide-react";

import { haptic, hapticNotify } from "@/integrations/telegram/webapp";

const SCREENS = [
  {
    icon: Sparkles,
    title: "Welcome to Solvane",
    body: "A participation-driven ecosystem. Show up, contribute, and build your standing.",
  },
  {
    icon: Zap,
    title: "Earn Solvane Points",
    body: "Run earning sessions to accrue SVP. Points are internal to Solvane and hold no monetary value.",
  },
  {
    icon: Target,
    title: "Missions & streaks",
    body: "Daily missions and consecutive-day streaks increase your multiplier and rewards.",
  },
  {
    icon: Users,
    title: "Invite your circle",
    body: "Share your referral link. You're rewarded when an invite qualifies through real activity.",
  },
  {
    icon: ShieldCheck,
    title: "$SVNE — coming later",
    body: "The Solvane token is not launched. Wallets, claims, and conversion stay disabled until then.",
  },
] as const;

export function Onboarding({ onFinish, busy }: { onFinish: () => void; busy?: boolean }) {
  const [step, setStep] = useState(0);
  const screen = SCREENS[step];
  if (!screen) return null;
  const Icon = screen.icon;
  const last = step === SCREENS.length - 1;

  return (
    <div className="safe-top flex min-h-screen flex-col justify-between bg-background px-6 pb-10">
      <div className="flex justify-end pt-2">
        {!last ? (
          <button
            onClick={() => {
              haptic();
              onFinish();
            }}
            className="text-sm text-muted-foreground"
          >
            Skip
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="bg-brand shadow-brand flex h-20 w-20 items-center justify-center rounded-3xl">
          <Icon className="h-9 w-9 text-primary-foreground" />
        </div>
        <h1 className="font-display mt-8 text-2xl font-semibold text-foreground">{screen.title}</h1>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{screen.body}</p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          {SCREENS.map((s, i) => (
            <span
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
        <button
          disabled={busy}
          onClick={() => {
            if (last) {
              hapticNotify("success");
              onFinish();
            } else {
              haptic();
              setStep((n) => n + 1);
            }
          }}
          className="bg-brand shadow-brand w-full rounded-2xl py-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {last ? (busy ? "Setting up…" : "Enter Solvane") : "Continue"}
        </button>
      </div>
    </div>
  );
}
