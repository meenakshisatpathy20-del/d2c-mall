/*
 * Groups several route handlers into one serverless function (keeps the
 * deployment within Vercel Hobby's function limit). vercel.json rewrites
 * /api/<group>/<action> → /api/<group>?action=<action>.
 */
import { send } from "./http.js";

export function router(routes) {
  return (req, res) => {
    const u = new URL(req.url, "http://local");
    const action = u.searchParams.get("action") || u.pathname.split("/").filter(Boolean).pop();
    const h = routes[action];
    if (!h) return send(res, 404, { error: { code: "NOT_FOUND", message: `Unknown endpoint: ${action}` } });
    return h(req, res);
  };
}
