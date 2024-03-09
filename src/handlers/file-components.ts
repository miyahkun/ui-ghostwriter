import { Hono } from "hono";
import { ofetch } from "ofetch";
import { auth } from "../middleware/auth";
import { Bindings } from "../types/cloudflare";

export const fileComponents = new Hono<{ Bindings: Bindings }>();

fileComponents.get("/", auth, async (c) => {
  console.log("bann!");
  const filePathBase = "/file/";
  const { file_url: fileUrl } = c.req.query();
  const { pathname } = new URL(fileUrl);
  console.log("url.pathname", pathname);
  if (!fileUrl || !pathname || !pathname.startsWith(filePathBase)) {
    return c.text("Bad Request", 400);
  }
  const fileId = pathname.replace(filePathBase, "").split("/")[0];
  console.log("fileId", fileId);

  const components = await ofetch(`https://api.figma.com/v1/files/${fileId}/components`, {
    headers: {
      Authorization: `Bearer ${c.var.access_token}`,
    },
  });
  return c.json(components);
});
