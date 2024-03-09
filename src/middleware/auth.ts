import { MiddlewareHandler } from "hono";
import { Bindings } from "../types/cloudflare";
import { getCookie } from "hono/cookie";
import { SessionData } from "../types/kv";

export const auth: MiddlewareHandler<{
  Bindings: Bindings;
  Variables: SessionData;
}> = async (c, next) => {
  const sessionId = getCookie(c, "session_id");
  if (!sessionId) {
    return c.text("Unauthorized", 401);
  }
  const rawSession = await c.env.KV.get(sessionId);
  if (!rawSession) {
    return c.text("Unauthorized", 401);
  }

  const session = JSON.parse(rawSession as string) as SessionData;
  Object.entries(session).forEach(([key, value]) => {
    c.set(key as keyof SessionData, value);
  });

  await next();
};
