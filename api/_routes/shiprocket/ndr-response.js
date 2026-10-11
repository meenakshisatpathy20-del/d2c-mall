/*
 * POST /api/shiprocket/ndr-response  (public — customer self-help after a failed delivery)
 * { orderId, phone, awb, action: "reattempt"|"update"|"cancel", date?, newPhone?, line1?, landmark? }
 * Verifies the phone against the order, then sends the request to Shiprocket's NDR action API.
 */
import { ApiError, handler, readJson, validate } from "../../_lib/http.js";
import { db, dbConfigured } from "../../_lib/db.js";
import { sr } from "../../_lib/shiprocket.js";

const last10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);

export default handler(
  ["POST"],
  async (req) => {
    const b = await readJson(req);
    validate(b, { orderId: ["string"], awb: ["string"], action: ["string"] });
    if (!["reattempt", "update", "cancel"].includes(b.action)) throw new ApiError(422, "VALIDATION_FAILED", "Unknown action");
    if (!dbConfigured()) throw new ApiError(503, "NOT_CONFIGURED", "Needs the database");
    const order = await db.get(`order:${b.orderId}`);
    if (!order || last10(order.address?.phone) !== last10(b.phone)) throw new ApiError(404, "NOT_FOUND", "Order ID and phone number don't match");
    if (!(order.liveShipments || []).some((s) => s.awb === b.awb)) throw new ApiError(404, "NOT_FOUND", "AWB does not belong to this order");
    const comments = [
      b.action === "cancel" ? "Customer requested return to origin" : "Customer requested re-attempt",
      b.date && `Preferred date ${String(b.date).slice(0, 10)}`,
      b.newPhone && `Alternate phone ${last10(b.newPhone)}`,
      b.line1 && `Address ${String(b.line1).slice(0, 120)}`,
      b.landmark && `Landmark ${String(b.landmark).slice(0, 80)}`,
    ].filter(Boolean).join(" · ");
    await sr(`/ndr/${encodeURIComponent(b.awb)}/action`, { method: "POST", body: { action: b.action === "cancel" ? "return" : "re-attempt", comments } });
    order.ndrResponses = [...(order.ndrResponses || []), { at: Date.now(), awb: b.awb, action: b.action, comments }];
    await db.set(`order:${order.id}`, order);
    return { ok: true };
  },
  { limit: 20, key: "sr-ndr-response" }
);
