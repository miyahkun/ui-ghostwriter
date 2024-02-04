import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { ofetch } from "ofetch";
import * as uuid from "uuid";

type Bindings = {
  ui_ghostwriter: KVNamespace;
  FIGMA_PERSONAL_ACCESS_TOKEN: string;
  FIGMA_CLIENT_ID: string;
  FIGMA_CLIENT_SECRET: string;
};

type ApiResponse_OauthToken = {
  user_id: number;
  access_token: string;
  expires_in: number;
};

type ApiResponse_Me = {
  id: string;
  email: string;
  handle: string;
  img_url: string;
};

type SessionData = {
  id: string;
  email: string;
  handle: string;
  img_url: string;
  access_token: string;
  expires_in: number;
};

const FIGMA_API_BASE_URL = "https://www.figma.com";

const API_BASE_URL = "http://localhost:8787";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Do you need your ghostwriter?");
});

app.get("/api/rest/v1/callback", async (c) => {
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
      method: "GET",
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

    await c.env.ui_ghostwriter.put(sessionId, JSON.stringify(session), { expirationTtl: ttl });
    return c.redirect("/");
  } catch (err) {
    console.error(err);
    return c.text(`Internal Server Error: ${(err as Error).name}`, 500);
  }
});

app.get("/api/rest/v1/signin", (c) => {
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

app.get("/api/rest/v1/files", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.text("Unauthorized", 401);
  }
  const rawSession = await c.env.ui_ghostwriter.get(sessionId);
  const session = JSON.parse(rawSession as string) as SessionData;

  return c.text(`Welcome, ${session.handle}`);
});

app.get("/api/rest/v1/team_projects", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.text("Unauthorized", 401);
  }
  const rawSession = await c.env.ui_ghostwriter.get(sessionId);
  const session = JSON.parse(rawSession as string) as SessionData;

  const teamUrlBase = "https://www.figma.com/files/team/";
  const { team_url: teamUrl } = c.req.query();
  console.log("teamUrl", teamUrl);
  if (!teamUrl || !teamUrl.startsWith(teamUrlBase)) {
    return c.text("Bad Request", 400);
  }

  const teamId = teamUrl.replace(teamUrlBase, "").split("/")[0];
  console.log("teamId", teamId);

  const files = await ofetch<ApiResponse_Me>(`https://api.figma.com/v1/teams/${teamId}/projects`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  return c.json(files);
});

export default app;

// http://localhost:8787/api/rest/v1/signin
