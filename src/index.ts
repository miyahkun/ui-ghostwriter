import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { ofetch } from "ofetch";
import * as uuid from "uuid";
import { Bindings } from "./types/cloudflare";
import { ApiResponse_Me, ApiResponse_OauthToken } from "./types/api";
import { SessionData } from "./types/kv";
import { auth } from "./middleware/auth";
import { teamProjects } from "./handlers/team-projects";
import { files } from "./handlers/files";
import { restApi } from "./rest-api";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Do you need your ghostwriter?");
});

app.route("/api", restApi);
app.route("/api/rest/v1/projects", files);

export default app;

// http://localhost:8787/api/rest/v1/signin
