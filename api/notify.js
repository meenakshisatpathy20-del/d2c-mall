/*
 * POST /api/notify   (server-to-server; requires Authorization: Bearer <INTERNAL_API_TOKEN>)
 * Sends order/shipment/refund notifications over Email / SMS / WhatsApp when
 * a provider is configured; otherwise returns "skipped" so flows keep working.
 * Providers: Resend (email), MSG91 (SMS), WhatsApp Cloud API.
 */
import crypto from "node:crypto";
import { ApiError, handler, readJson, validate } from "./_lib/http.js";

const TEMPLATES = {
  order_confirmed: (d) => `Hi ${d.name}, your D2C Mall order ${d.orderId} is confirmed! Total ₹${d.total}. Track: ${d.link}`,
  payment_received: (d) => `Payment of ₹${d.total} received for order ${d.orderId}. Thank you for shopping with D2C Mall.`,
  shipment_created: (d) => `Order ${d.orderId} is packed and will ship via ${d.courier} (AWB ${d.awb}).`,
  out_for_delivery: (d) => `Your D2C Mall order ${d.orderId} is out for delivery today. Keep your phone handy!`,
  delivered: (d) => `Delivered! Order ${d.orderId} has reached you. Rate your purchase: ${d.link}`,
  delivery_failed: (d) => `We couldn't deliver order ${d.orderId}. The courier will re-attempt tomorrow.`,
  refund_processed: (d) => `Refund of ₹${d.amount} for ${d.orderId} has been processed to your ${d.method}.`,
};

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
    const render = TEMPLATES[b.template];
    if (!render) throw new ApiError(422, "UNKNOWN_TEMPLATE", "Unknown template");
    const text = render(b.data || {});
    const results = {};

    for (const channel of b.channels.split(",")) {
      if (channel === "email") {
        if (!process.env.RESEND_API_KEY || !b.email) { results.email = "skipped"; continue; }
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: process.env.EMAIL_FROM || "D2C Mall <orders@d2cmall.in>", to: b.email, subject: `D2C Mall · ${b.template.replace(/_/g, " ")}`, text }),
        });
        results.email = r.ok ? "sent" : "failed";
      } else if (channel === "sms") {
        if (!process.env.MSG91_AUTH_KEY || !b.phone) { results.sms = "skipped"; continue; }
        const r = await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: { authkey: process.env.MSG91_AUTH_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, recipients: [{ mobiles: `91${b.phone}`, message: text }] }),
        });
        results.sms = r.ok ? "sent" : "failed";
      } else if (channel === "whatsapp") {
        if (!process.env.WHATSAPP_TOKEN || !b.phone) { results.whatsapp = "skipped"; continue; }
        const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: `91${b.phone}`, type: "text", text: { body: text } }),
        });
        results.whatsapp = r.ok ? "sent" : "failed";
      }
    }
    return { text, results };
  },
  { limit: 120, key: "notify" }
);
