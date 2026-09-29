/*
 * POST /api/notify  (server-to-server; Authorization: Bearer <INTERNAL_API_TOKEN>)
 * { template, channels: "email,sms,whatsapp", email?, phone?, data }
 */
import crypto from "node:crypto";
import { ApiError, handler, readJson, validate } from "./_lib/http.js";
import { TEMPLATES, sendNotification } from "./_lib/notify.js";

export default handler(
  ["POST"],
  async (req) => {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const expected = process.env.INTERNAL_API_TOKEN || "";
    if (!expected || token.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      throw new ApiError(401, "UNAUTHORIZED", "Internal token required");
    }
    const b = await readJson(req);
    validate(b, { template: ["string"], channels: ["string"] });
    if (!TEMPLATES[b.template] || b.template === "otp") throw new ApiError(422, "UNKNOWN_TEMPLATE", "Unknown template");
    return sendNotification({ template: b.template, data: b.data || {}, email: b.email, phone: b.phone, channels: b.channels.split(",") });
  },
  { limit: 120, key: "notify" }
);
