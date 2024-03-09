import { Hono } from "hono";
import { Bindings } from "../types/cloudflare";
import { API_BASE_URL } from "../constants";
import * as uuid from "uuid";
import { setCookie } from "hono/cookie";

export const signIn = new Hono<{ Bindings: Bindings }>();

signIn.get("/", (c) => {
  const url = new URL("https://www.figma.com/oauth");
  url.searchParams.append("client_id", c.env.FIGMA_CLIENT_ID);
  url.searchParams.append("redirect_uri", `${API_BASE_URL}/api/rest/v1/callback`);
  url.searchParams.append("scope", "files:read");
  4;

  const state = uuid.v4();
  setCookie(c, "state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
  });
  url.searchParams.append("state", state);

  url.searchParams.append("response_type", "code");
  return c.redirect(url.toString());
});
