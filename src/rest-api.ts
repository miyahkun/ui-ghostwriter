import { Hono } from "hono";
import { Bindings } from "./types/cloudflare";
import { callback } from "./handlers/callback";
import { signIn } from "./handlers/sign-in";
import { files } from "./handlers/files";
import { projects } from "./handlers/projects";
import { teamProjects } from "./handlers/team-projects";
import { teamComponents } from "./handlers/team-components";
import { components } from "./handlers/components";
import { fileComponents } from "./handlers/file-components";

export const restApi = new Hono<{ Bindings: Bindings }>().basePath("/rest/v1");

restApi.route("/callback", callback);
restApi.route("/sign-in", signIn);
restApi.route("/projects", projects);
restApi.route("/teams/projects", teamProjects);
restApi.route("/teams/components", teamComponents);
restApi.route("/files/components", fileComponents);
restApi.route("/files", files);
restApi.route("/components", components);
