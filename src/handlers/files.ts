import { Hono } from "hono";
import { ofetch } from "ofetch";
import { auth } from "../middleware/auth";
import { ApiResponse_Me } from "../types/api";
import { Bindings } from "../types/cloudflare";

export const files = new Hono<{ Bindings: Bindings }>();

files.get("/:fileId", auth, async (c) => {
  const fileId = c.req.param("fileId");

  const files = await ofetch<ApiResponse_Me>(`https://api.figma.com/v1/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${c.var.access_token}`,
    },
  });
  return c.json(files);
});
