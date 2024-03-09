import { Hono } from "hono";
import { ofetch } from "ofetch";
import { FIGMA_API_BASE_URL } from "../constants";
import { getCookie, setCookie } from "hono/cookie";
import { ApiResponse_Me, ApiResponse_OauthToken } from "../types/api";
import * as uuid from "uuid";
import { SessionData } from "../types/kv";
import { Bindings } from "../types/cloudflare";

export const callback = new Hono<{ Bindings: Bindings }>();

callback.get("/", async (c) => {
  const query = c.req.query();
  const state = getCookie(c, "state");

  if (typeof state === "undefined" || typeof query.code !== "string" || state !== query.state) {
    return c.text("Invalid state", 400);
  }

  const url = new URL(`${FIGMA_API_BASE_URL}/api/oauth/token`);
  url.searchParams.append("client_id", c.env.FIGMA_CLIENT_ID);
  url.searchParams.append("client_secret", c.env.FIGMA_CLIENT_SECRET);
  url.searchParams.append("redirect_uri", `http://localhost:8787/api/rest/v1/callback`);
  url.searchParams.append("code", query.code);
  url.searchParams.append("grant_type", "authorization_code");

  try {
    const data = await ofetch<ApiResponse_OauthToken>(url.toString(), {
      method: "POST",
      parseResponse: JSON.parse,
    });

    const me = await ofetch<ApiResponse_Me>("https://api.figma.com/v1/me", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const ttl = 60 * 60 * 24;
    const sessionId = uuid.v4();
    setCookie(c, "session_id", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: ttl,
      path: "/",
    });

    const session: SessionData = {
      id: me.id,
      email: me.email,
      handle: me.handle,
      img_url: me.img_url,
      access_token: data.access_token,
      expires_in: data.expires_in,
    };

    await c.env.KV.put(sessionId, JSON.stringify(session), { expirationTtl: ttl });
    return c.redirect("/");
  } catch (err) {
    console.error(err);
    return c.text(`Internal Server Error: ${(err as Error).name}`, 500);
  }
});
