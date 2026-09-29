import { router } from "./_lib/router.js";
import createOrder from "./_routes/payments/create-order.js";
import verify from "./_routes/payments/verify.js";
import webhook from "./_routes/payments/webhook.js";

export default router({ "create-order": createOrder, verify, webhook });
