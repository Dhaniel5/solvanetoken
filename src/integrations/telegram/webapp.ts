/**
 * Thin wrapper around the Telegram Mini App (WebApp) runtime.
 * Every helper degrades gracefully when the app runs in a normal browser.
 */

export const BOT_USERNAME = "Solavne_bot";
export const MINI_APP_NAME = "solvane";

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type NotificationType = "error" | "success" | "warning";

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { start_param?: string; user?: { id: number; first_name?: string } };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportStableHeight: number;
  ready: () => void;
  expand: () => void;
  close: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  shareToStory?: (url: string) => void;
  BackButton: { show: () => void; hide: () => void; onClick: (cb: () => void) => void; offClick: (cb: () => void) => void };
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: NotificationType) => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

export function tg(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return window.Telegram?.WebApp;
}

export function isTelegram(): boolean {
  const app = tg();
  return Boolean(app && app.initData && app.initData.length > 0);
}

export function loadTelegramScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Telegram?.WebApp) return Promise.resolve();
  const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existing) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
}

export function initTelegram() {
  const app = tg();
  if (!app) return;
  try {
    app.ready();
    app.expand();
    app.disableVerticalSwipes?.();
    app.setHeaderColor?.("#12121c");
    app.setBackgroundColor?.("#12121c");
  } catch {
    /* older clients */
  }
}

export function getInitData(): string {
  return tg()?.initData ?? "";
}

export function getStartParam(): string | null {
  const app = tg();
  const fromTelegram = app?.initDataUnsafe?.start_param;
  if (fromTelegram) return fromTelegram;
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  return url.searchParams.get("startapp") ?? url.searchParams.get("ref");
}

export function haptic(style: HapticStyle = "light") {
  tg()?.HapticFeedback?.impactOccurred(style);
}

export function hapticNotify(type: NotificationType) {
  tg()?.HapticFeedback?.notificationOccurred(type);
}

export function useBackButtonBinding(visible: boolean, onClick: () => void) {
  const app = tg();
  if (!app) return () => {};
  if (visible) {
    app.BackButton.onClick(onClick);
    app.BackButton.show();
  } else {
    app.BackButton.hide();
  }
  return () => {
    app.BackButton.offClick(onClick);
    app.BackButton.hide();
  };
}

export function referralLink(code: string) {
  return `https://t.me/${BOT_USERNAME}/${MINI_APP_NAME}?startapp=${encodeURIComponent(code)}`;
}

export function shareReferral(code: string) {
  const link = referralLink(code);
  const text = "Join me on Solvane and start earning Solvane Points.";
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  const app = tg();
  if (app?.openTelegramLink) {
    app.openTelegramLink(shareUrl);
    return true;
  }
  if (typeof window !== "undefined") {
    window.open(shareUrl, "_blank", "noopener");
    return true;
  }
  return false;
}
