import { handler } from "./_lib/http.js";

export default handler(["GET"], async () => ({
  ok: true,
  service: "d2c-mall-api",
  time: new Date().toISOString(),
  integrations: {
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    razorpayWebhook: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    shiprocket: Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD),
    jwt: Boolean(process.env.JWT_SECRET),
    notifications: Boolean(process.env.MSG91_AUTH_KEY || process.env.WHATSAPP_TOKEN || process.env.RESEND_API_KEY),
  },
}));
