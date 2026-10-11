/*
 * GET /api/shiprocket/track-order?orderId=OD…&phone=98…
 * Public tracking (no login): the phone number must match the order.
 * Returns each shipment's AWB with its live Shiprocket timeline.
 */
import { ApiError, handler } from "../../_lib/http.js";
import { db, dbConfigured } from "../../_lib/db.js";
import { mapStatus, sr } from "../../_lib/shiprocket.js";

const last10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);

export default handler(
  ["GET"],
  async (req) => {
    const q = Object.fromEntries(new URL(req.url, "http://x").searchParams);
    if (!/^[A-Z0-9-]{6,30}$/i.test(q.orderId || "") || last10(q.phone).length !== 10) throw new ApiError(422, "VALIDATION_FAILED", "Enter your order ID and 10-digit phone number");
    if (!dbConfigured()) throw new ApiError(503, "NOT_CONFIGURED", "Order lookup needs the database");
    const order = await db.get(`order:${q.orderId}`);
    if (!order || last10(order.address?.phone) !== last10(q.phone)) throw new ApiError(404, "NOT_FOUND", "Order ID and phone number don't match our records");
    const shipments = [];
    for (const s of order.liveShipments || []) {
      if (!s.awb) {
        shipments.push({ warehouseId: s.warehouseId, awb: null, status: "new", events: [] });
        continue;
      }
      const data = await sr(`/courier/track/awb/${encodeURIComponent(s.awb)}`).catch(() => null);
      const t = data?.tracking_data || {};
      const cur = t.shipment_track?.[0] || {};
      shipments.push({
        warehouseId: s.warehouseId,
        awb: s.awb,
        courier: cur.courier_name || s.courier,
        status: mapStatus(cur.current_status),
        etd: t.etd || null,
        events: (t.shipment_track_activities || []).map((e) => ({ at: e.date, status: mapStatus(e["sr-status-label"] || e.activity), note: e.activity, location: e.location })),
      });
    }
    return { orderId: order.id, city: order.address.city, placedAt: order.createdAt, shipments };
  },
  { limit: 60, key: "sr-track-order" }
);
