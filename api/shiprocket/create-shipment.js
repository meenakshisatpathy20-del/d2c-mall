/*
 * POST /api/shiprocket/create-shipment   (roles: super_admin, logistics, warehouse_admin)
 * Creates a Shiprocket ad-hoc order for one D2C Mall shipment, assigns an AWB
 * (optionally a specific courier) and schedules pickup from the warehouse.
 */
import { ApiError, handler, readJson, validate } from "../_lib/http.js";
import { requireAuth } from "../_lib/auth.js";
import { PICKUP_LOCATIONS, sr } from "../_lib/shiprocket.js";

export default handler(
  ["POST"],
  async (req) => {
    requireAuth(req, ["super_admin", "logistics", "warehouse_admin"]);
    const b = await readJson(req);
    validate(b, { orderId: ["string"], shipmentId: ["string"], warehouseId: ["string"], paymentMethod: ["string"], subTotal: ["number"] });
    const pickup = PICKUP_LOCATIONS[b.warehouseId];
    if (!pickup) throw new ApiError(422, "UNKNOWN_WAREHOUSE", "Unknown warehouse");
    const a = b.address || {};
    validate(a, { name: ["string"], phone: ["phone"], line1: ["string"], city: ["string"], state: ["string"], pincode: ["pincode"] });

    const created = await sr("/orders/create/adhoc", {
      method: "POST",
      body: {
        order_id: b.shipmentId,
        order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
        pickup_location: pickup,
        billing_customer_name: a.name,
        billing_last_name: "",
        billing_address: a.line1,
        billing_address_2: a.line2 || "",
        billing_city: a.city,
        billing_pincode: a.pincode,
        billing_state: a.state,
        billing_country: "India",
        billing_email: b.email || "orders@d2cmall.in",
        billing_phone: a.phone,
        shipping_is_billing: true,
        order_items: (b.items || []).map((i) => ({ name: i.name, sku: i.sku, units: i.qty, selling_price: i.price })),
        payment_method: b.paymentMethod === "cod" ? "COD" : "Prepaid",
        sub_total: b.subTotal,
        length: b.length || 30,
        breadth: b.breadth || 25,
        height: b.height || 5,
        weight: b.weight || 0.5,
      },
    });

    const awb = await sr("/courier/assign/awb", {
      method: "POST",
      body: { shipment_id: created.shipment_id, ...(b.courierId ? { courier_id: b.courierId } : {}) },
    });
    await sr("/courier/generate/pickup", { method: "POST", body: { shipment_id: [created.shipment_id] } }).catch(() => null);

    const data = awb?.response?.data || {};
    return {
      shiprocketOrderId: created.order_id,
      shiprocketShipmentId: created.shipment_id,
      awb: data.awb_code,
      courier: data.courier_name,
      courierId: data.courier_company_id,
      trackingUrl: data.awb_code ? `https://shiprocket.co/tracking/${data.awb_code}` : null,
    };
  },
  { limit: 30, key: "sr-create" }
);
