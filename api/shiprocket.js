import { router } from "./_lib/router.js";
import serviceability from "./_routes/shiprocket/serviceability.js";
import createShipment from "./_routes/shiprocket/create-shipment.js";
import track from "./_routes/shiprocket/track.js";
import webhook from "./_routes/shiprocket/webhook.js";

export default router({ serviceability, "create-shipment": createShipment, track, webhook });
