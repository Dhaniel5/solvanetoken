import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const APP_URL = "https://solvanetoken.lovable.app/";
const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

function expectedSecret() {
  return createHmac("sha256", process.env["SOLVANE_AUTH_SECRET"]!)
    .update("telegram-webhook")
    .digest("hex");
}

async function sendMessage(body: Record<string, unknown>) {
  await fetch(`${GATEWAY}/sendMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      "X-Connection-Api-Key": process.env["TELEGRAM_API_KEY"]!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const got = Buffer.from(request.headers.get("x-telegram-bot-api-secret-token") ?? "");
        const exp = Buffer.from(expectedSecret());
        if (got.length !== exp.length || !timingSafeEqual(got, exp)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json().catch(() => null)) as {
          message?: { chat?: { id?: number; type?: string }; text?: string };
        } | null;
        const msg = update?.message;
        const chatId = msg?.chat?.id;
        if (!chatId || msg?.chat?.type !== "private" || typeof msg.text !== "string") {
          return new Response("ok");
        }

        // /start or /start <referral_code>
        const match = msg.text.trim().match(/^\/start(?:@\w+)?(?:\s+([A-Za-z0-9_-]{1,64}))?$/);
        const ref = match?.[1];
        const url = ref ? `${APP_URL}?startapp=${encodeURIComponent(ref)}` : APP_URL;

        await sendMessage({
          chat_id: chatId,
          text:
            "Welcome to Solvane ✨\n\nRun earning sessions, keep your streak, complete missions and climb the leaderboard with Solvane Points (SVP).\n\nTap below to open the app.",
          reply_markup: {
            inline_keyboard: [[{ text: "Open Solvane", web_app: { url } }]],
          },
        });
        return new Response("ok");
      },
    },
  },
});
