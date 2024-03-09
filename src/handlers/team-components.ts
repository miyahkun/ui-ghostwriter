import { Hono } from "hono";
import { ofetch } from "ofetch";
import { auth } from "../middleware/auth";
import { ApiResponse_Me } from "../types/api";
import { Bindings } from "../types/cloudflare";

export const teamComponents = new Hono<{ Bindings: Bindings }>();

teamComponents.get("/", auth, async (c) => {
  const teamUrlBase = "https://www.figma.com/files/team/";
  const { team_url: teamUrl } = c.req.query();
  if (!teamUrl || !teamUrl.startsWith(teamUrlBase)) {
    return c.text("Bad Request", 400);
  }
  const teamId = teamUrl.replace(teamUrlBase, "").split("/")[0];

  const components = await ofetch<ApiResponse_Me>(
    `https://api.figma.com/v1/teams/${teamId}/components`,
    {
      headers: {
        Authorization: `Bearer ${c.var.access_token}`,
      },
    }
  );
  return c.json(components);
});
