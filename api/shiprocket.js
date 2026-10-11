import { router } from "./_lib/router.js";
import serviceability from "./_routes/shiprocket/serviceability.js";
import createShipment from "./_routes/shiprocket/create-shipment.js";
import track from "./_routes/shiprocket/track.js";
import webhook from "./_routes/shiprocket/webhook.js";
import ops from "./_routes/shiprocket/ops.js";
import trackOrder from "./_routes/shiprocket/track-order.js";
import ndrResponse from "./_routes/shiprocket/ndr-response.js";

export default router({ serviceability, "create-shipment": createShipment, track, webhook, ops, "track-order": trackOrder, "ndr-response": ndrResponse });
