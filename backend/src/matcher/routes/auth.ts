import { Hono } from "hono";
import { createHmac, randomBytes } from "crypto";
import { config } from "../../config";
import { log } from "../../util/log";
import { getVerifiedGithub, setVerifiedGithub } from "../store";

type Variables = { reqId: string };

export const authRoutes = new Hono<{ Variables: Variables }>();

// GitHub OAuth flow — "sign in with GitHub" tied to a wallet.
//
// 1. Frontend hits   GET /api/auth/github/start?wallet=0x...&redirect=<url>
//    Backend signs { wallet, redirect, nonce } as the `state` param and
//    302-redirects to github.com's authorize URL.
// 2. User approves on github.com.
// 3. GitHub bounces to GET /api/auth/github/callback?code=...&state=...
//    Backend verifies the HMAC on `state`, exchanges `code` for a token,
//    calls /user, records the verified login against the wallet, then
//    302-redirects back to the frontend's chosen URL with ?github=<login>.
//
// The state HMAC is the CSRF protection; without it anyone could feed a
// malicious callback pair and mis-attribute a handle to someone else's
// wallet.

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function signState(payload: object): string {
  if (!config.githubOauthSecret) {
    throw new Error("GITHUB_OAUTH_STATE_SECRET not configured");
  }
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const mac = b64url(
    createHmac("sha256", config.githubOauthSecret).update(body).digest(),
  );
  return `${body}.${mac}`;
}

function verifyState(state: string): { wallet: string; redirect?: string; nonce: string } | null {
  if (!config.githubOauthSecret) return null;
  const [body, mac] = state.split(".");
  if (!body || !mac) return null;
  const expected = b64url(
    createHmac("sha256", config.githubOauthSecret).update(body).digest(),
  );
  if (expected !== mac) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

authRoutes.get("/auth/github/start", (c) => {
  if (!config.githubOauthClientId || !config.githubOauthSecret) {
    return c.json({ error: "github_oauth_not_configured" }, 500);
  }
  const wallet = c.req.query("wallet")?.toLowerCase();
  const redirect = c.req.query("redirect");
  if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
    return c.json({ error: "wallet query param required" }, 400);
  }

  const state = signState({
    wallet,
    redirect: redirect ?? null,
    nonce: randomBytes(16).toString("hex"),
  });

  const params = new URLSearchParams({
    client_id: config.githubOauthClientId,
    redirect_uri: config.githubOauthCallback,
    scope: "read:user",
    state,
    allow_signup: "true",
  });
  const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
  return c.redirect(url);
});

authRoutes.get("/auth/github/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) {
    return c.json({ error: "missing code or state" }, 400);
  }
  const parsed = verifyState(state);
  if (!parsed) {
    return c.json({ error: "invalid state (CSRF protection)" }, 400);
  }

  let accessToken: string | null = null;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        client_id: config.githubOauthClientId,
        client_secret: config.githubOauthClientSecret,
        code,
        redirect_uri: config.githubOauthCallback,
      }),
    });
    const tokenBody = (await tokenRes.json()) as { access_token?: string; error?: string };
    if (!tokenBody.access_token) {
      log.warn("github.oauth token exchange failed", { err: tokenBody.error });
      return c.json({ error: "github_oauth_exchange_failed" }, 502);
    }
    accessToken = tokenBody.access_token;
  } catch (e) {
    log.warn("github.oauth token exchange threw", { err: String(e) });
    return c.json({ error: "github_oauth_exchange_threw" }, 502);
  }

  let login: string | null = null;
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/vnd.github+json",
        "user-agent": "buildermatch",
      },
    });
    if (!userRes.ok) {
      return c.json({ error: "github_user_fetch_failed" }, 502);
    }
    const user = (await userRes.json()) as { login?: string };
    login = user.login ?? null;
  } catch (e) {
    log.warn("github.oauth user fetch threw", { err: String(e) });
    return c.json({ error: "github_user_fetch_threw" }, 502);
  }

  if (!login) return c.json({ error: "github_login_missing" }, 502);

  setVerifiedGithub(parsed.wallet, login);
  log.info("github.oauth verified", { wallet: parsed.wallet, login });

  const target =
    parsed.redirect && /^https?:\/\//.test(parsed.redirect)
      ? `${parsed.redirect}${parsed.redirect.includes("?") ? "&" : "?"}github=${encodeURIComponent(login)}`
      : `/?github=${encodeURIComponent(login)}`;
  return c.redirect(target);
});

// Introspection endpoint for the frontend — after the redirect-based OAuth
// roundtrip, the landing page polls this to recover the stored handle for
// the connected wallet (the callback only knows the wallet, not the
// frontend's React state).
authRoutes.get("/auth/github/status", (c) => {
  const wallet = c.req.query("wallet")?.toLowerCase();
  if (!wallet || !/^0x[a-f0-9]{40}$/.test(wallet)) {
    return c.json({ error: "wallet query param required" }, 400);
  }
  const login = getVerifiedGithub(wallet);
  return c.json({ wallet, verifiedGithub: login ?? null });
});
