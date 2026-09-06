import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { telegramSignIn, devSignIn } from "@/lib/auth.functions";
import {
  getInitData,
  getStartParam,
  initTelegram,
  isTelegram,
  loadTelegramScript,
} from "@/integrations/telegram/webapp";
import { userService, type Profile } from "@/services/userService";
import { configService } from "@/services/configService";
import { referralService } from "@/services/referralService";
import { friendlyError } from "@/services/client";

const DEVICE_KEY = "solvane.device-key";
const PENDING_REFERRAL = "solvane.pending-referral";

type Status = "loading" | "ready" | "error";

interface SolvaneContextValue {
  status: Status;
  error: string | null;
  userId: string | null;
  profile: Profile | null;
  flags: Record<string, boolean>;
  isAdmin: boolean;
  inTelegram: boolean;
  refresh: () => void;
  retry: () => void;
}

const SolvaneContext = createContext<SolvaneContextValue | null>(null);

function deviceKey() {
  let key = localStorage.getItem(DEVICE_KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, key);
  }
  return key;
}

export function SolvaneProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [inTelegram, setInTelegram] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setStatus("loading");
      setError(null);
      try {
        initTelegram();
        const telegram = isTelegram();
        if (!cancelled) setInTelegram(telegram);

        const startParam = getStartParam();
        if (startParam) localStorage.setItem(PENDING_REFERRAL, startParam);

        const existing = await supabase.auth.getSession();
        let uid = existing.data.session?.user.id ?? null;

        if (!uid) {
          const session = telegram
            ? await telegramSignIn({ data: { initData: getInitData() } })
            : await devSignIn({ data: { deviceKey: deviceKey() } });
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          if (sessionError) throw sessionError;
          uid = data.session?.user.id ?? null;
        }
        if (!uid) throw new Error("Could not start a Solvane session.");

        const pending = localStorage.getItem(PENDING_REFERRAL);
        if (pending) {
          try {
            await referralService.apply(pending);
          } catch {
            /* referral is best-effort */
          }
          localStorage.removeItem(PENDING_REFERRAL);
        }

        if (cancelled) return;
        setUserId(uid);
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(friendlyError(err));
        setStatus("error");
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => userService.me(),
    enabled: Boolean(userId),
  });

  const flagsQuery = useQuery({
    queryKey: ["flags"],
    queryFn: () => configService.flags(),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });

  const adminQuery = useQuery({
    queryKey: ["is-admin", userId],
    queryFn: () => userService.isAdmin(userId as string),
    enabled: Boolean(userId),
  });

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries();
  }, [queryClient]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return (
    <SolvaneContext.Provider
      value={{
        status,
        error,
        userId,
        profile: profileQuery.data ?? null,
        flags: flagsQuery.data ?? {},
        isAdmin: adminQuery.data ?? false,
        inTelegram,
        refresh,
        retry,
      }}
    >
      {children}
    </SolvaneContext.Provider>
  );
}

export function useSolvane() {
  const ctx = useContext(SolvaneContext);
  if (!ctx) throw new Error("useSolvane must be used inside SolvaneProvider");
  return ctx;
}
