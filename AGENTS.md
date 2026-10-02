<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Telegram bot updates arrive at /api/public/telegram/webhook, authenticated by a secret token derived as HMAC-SHA256(SOLVANE_AUTH_SECRET, "telegram-webhook"); why: no extra secret to manage and spoofed calls are rejected.
- The profile protection trigger checks current_user (not the role setting) so trusted server functions can update balances; why: the role setting stays "authenticated" inside SECURITY DEFINER functions.
