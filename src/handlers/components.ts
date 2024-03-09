import { Hono } from "hono";
import { ofetch } from "ofetch";
import { auth } from "../middleware/auth";
import { Bindings } from "../types/cloudflare";

export const components = new Hono<{ Bindings: Bindings }>();

components.get("/:key", auth, async (c) => {
  const key = c.req.param("key");

  const components = await ofetch(`https://api.figma.com/v1/components/${key}`, {
    headers: {
      Authorization: `Bearer ${c.var.access_token}`,
    },
  });
  return c.json(components);
});
