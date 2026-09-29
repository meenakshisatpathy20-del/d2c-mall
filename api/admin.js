import { router } from "./_lib/router.js";
import login from "./_routes/admin/login.js";
import orders from "./_routes/admin/orders.js";

export default router({ login, orders });
