/*
 * GET /api/admin/orders?limit=50   (admin JWT: super_admin, support, logistics, warehouse_admin)
 * Latest orders persisted by /api/orders/confirm. Warehouse admins only see
 * orders that include a shipment from their warehouse.
 */
import { handler } from "../../_lib/http.js";
import { requireAuth } from "../../_lib/auth.js";
import { db } from "../../_lib/db.js";

export default handler(["GET"], async (req) => {
  const claims = requireAuth(req, ["super_admin", "support", "logistics", "warehouse_admin"]);
  const limit = Math.min(Number(new URL(req.url, "http://x").searchParams.get("limit")) || 50, 200);
  const ids = await db.lrange("orders:all", 0, limit - 1);
  let orders = (await Promise.all(ids.map((id) => db.get(`order:${id}`)))).filter(Boolean);
  if (claims.role === "warehouse_admin") orders = orders.filter((o) => (o.fulfilmentPlan || []).some((g) => g.warehouseId === claims.warehouseId));
  return { orders };
});
