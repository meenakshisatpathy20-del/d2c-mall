/*
 * POST /api/shiprocket/ops   { action, ...params }        (admin roles only)
 * Live counterparts of the buttons in the admin Shipping console.
 * Endpoint paths follow Shiprocket's API docs (https://apidocs.shiprocket.in/).
 *
 *   assign-awb   { srShipmentId, courierId? }        → AWB + courier
 *   pickup       { srShipmentIds: [] }               → pickup request
 *   label        { srShipmentIds: [] }               → label PDF url
 *   manifest     { srShipmentIds: [] }               → manifest PDF url
 *   invoice      { srOrderIds: [] }                  → invoice PDF url
 *   cancel       { srOrderIds: [] }                  → cancel shipment/order
 *   ndr-list     {}                                  → open NDR cases
 *   ndr-action   { awb, ndrAction: "re-attempt"|"return", comments }
 *   return-order { ...Shiprocket return order body } → reverse pickup
 */
import { ApiError, handler, readJson, validate } from "../../_lib/http.js";
import { requireAuth } from "../../_lib/auth.js";
import { sr } from "../../_lib/shiprocket.js";
import { db, dbConfigured } from "../../_lib/db.js";

const OPS_ROLES = ["super_admin", "logistics", "warehouse_admin"];
const SUPPORT_ACTIONS = ["ndr-list", "ndr-action"];

const ids = (v, name) => {
  if (!Array.isArray(v) || !v.length || v.length > 100) throw new ApiError(422, "VALIDATION_FAILED", `${name} must be a non-empty list`);
  return v.map(String);
};

export default handler(
  ["POST"],
  async (req) => {
    const b = await readJson(req);
    validate(b, { action: ["string"] });
    const claims = requireAuth(req, [...OPS_ROLES, "support"]);
    if (claims.role === "support" && !SUPPORT_ACTIONS.includes(b.action)) throw new ApiError(403, "FORBIDDEN", "Support can only act on NDR cases");

    switch (b.action) {
      case "assign-awb": {
        if (!b.srShipmentId) throw new ApiError(422, "VALIDATION_FAILED", "srShipmentId is required");
        const r = await sr("/courier/assign/awb", { method: "POST", body: { shipment_id: b.srShipmentId, ...(b.courierId && /^\d+$/.test(String(b.courierId)) ? { courier_id: b.courierId } : {}) } });
        const d = r?.response?.data || {};
        // Remember AWB → order so webhook scans and public tracking find it.
        if (d.awb_code && dbConfigured() && b.orderId) {
          const order = await db.get(`order:${b.orderId}`);
          if (order) {
            order.liveShipments = (order.liveShipments || []).map((s) => (String(s.shiprocketShipmentId) === String(b.srShipmentId) ? { ...s, awb: d.awb_code, courier: d.courier_name } : s));
            await db.set(`order:${order.id}`, order);
            await db.set(`awb:${d.awb_code}`, { orderId: order.id, userId: order.userId });
          }
        }
        return { awb: d.awb_code, courier: d.courier_name, courierId: d.courier_company_id, trackingUrl: d.awb_code ? `https://shiprocket.co/tracking/${d.awb_code}` : null };
      }
      case "pickup":
        return sr("/courier/generate/pickup", { method: "POST", body: { shipment_id: ids(b.srShipmentIds, "srShipmentIds") } });
      case "label": {
        const r = await sr("/courier/generate/label", { method: "POST", body: { shipment_id: ids(b.srShipmentIds, "srShipmentIds") } });
        return { labelUrl: r?.label_url || null };
      }
      case "manifest": {
        const r = await sr("/manifests/generate", { method: "POST", body: { shipment_id: ids(b.srShipmentIds, "srShipmentIds") } });
        return { manifestUrl: r?.manifest_url || null };
      }
      case "invoice": {
        const r = await sr("/orders/print/invoice", { method: "POST", body: { ids: ids(b.srOrderIds, "srOrderIds") } });
        return { invoiceUrl: r?.invoice_url || null };
      }
      case "cancel":
        return sr("/orders/cancel", { method: "POST", body: { ids: ids(b.srOrderIds, "srOrderIds") } });
      case "ndr-list":
        return sr("/ndr/all");
      case "ndr-action": {
        if (!/^[A-Za-z0-9]{6,30}$/.test(String(b.awb || ""))) throw new ApiError(422, "INVALID_AWB", "Valid AWB required");
        if (!["re-attempt", "return"].includes(b.ndrAction)) throw new ApiError(422, "VALIDATION_FAILED", "ndrAction must be re-attempt or return");
        return sr(`/ndr/${encodeURIComponent(b.awb)}/action`, { method: "POST", body: { action: b.ndrAction, comments: String(b.comments || "").slice(0, 300) } });
      }
      case "return-order":
        return sr("/orders/create/return", { method: "POST", body: b.payload || {} });
      default:
        throw new ApiError(422, "UNKNOWN_ACTION", `Unknown action ${b.action}`);
    }
  },
  { limit: 120, key: "sr-ops" }
);
