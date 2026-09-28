/*
 * GET /api/shiprocket/serviceability?pickup=421302&delivery=831001&weight=0.5&cod=1
 * Returns available couriers with ETA, rate and COD support.
 */
import { handler, validate } from "../_lib/http.js";
import { sr } from "../_lib/shiprocket.js";

export default handler(
  ["GET"],
  async (req) => {
    const q = Object.fromEntries(new URL(req.url, "http://x").searchParams);
    validate(q, { pickup: ["pincode"], delivery: ["pincode"] });
    const data = await sr("/courier/serviceability/", {
      query: { pickup_postcode: q.pickup, delivery_postcode: q.delivery, weight: q.weight || 0.5, cod: q.cod === "1" ? 1 : 0 },
    });
    const list = data?.data?.available_courier_companies || [];
    return {
      serviceable: list.length > 0,
      recommended: data?.data?.recommended_courier_company_id || null,
      couriers: list.map((c) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        etd: c.etd,
        days: Number(c.estimated_delivery_days) || null,
        rate: c.rate,
        cod: c.cod === 1,
        rating: c.rating,
      })),
    };
  },
  { limit: 60, key: "sr-serviceability" }
);
