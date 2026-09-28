/*
 * GET /api/shiprocket/track?awb=XXXXXXXX
 * Customer-facing tracking timeline (polled by the tracking page).
 */
import { ApiError, handler } from "../_lib/http.js";
import { mapStatus, sr } from "../_lib/shiprocket.js";

export default handler(
  ["GET"],
  async (req) => {
    const awb = new URL(req.url, "http://x").searchParams.get("awb") || "";
    if (!/^[A-Za-z0-9]{6,30}$/.test(awb)) throw new ApiError(422, "INVALID_AWB", "Enter a valid AWB number");
    const data = await sr(`/courier/track/awb/${encodeURIComponent(awb)}`);
    const t = data?.tracking_data || {};
    const current = t.shipment_track?.[0] || {};
    return {
      awb,
      status: mapStatus(current.current_status),
      rawStatus: current.current_status,
      courier: current.courier_name,
      etd: t.etd || current.edd || null,
      deliveredTo: current.delivered_to || null,
      events: (t.shipment_track_activities || []).map((e) => ({
        at: e.date,
        status: mapStatus(e["sr-status-label"] || e.activity),
        note: e.activity,
        location: e.location,
      })),
    };
  },
  { limit: 120, key: "sr-track" }
);
