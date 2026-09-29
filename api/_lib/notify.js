/*
 * Notification sender shared by API routes (order confirmation, shipment
 * updates, OTP). Each channel is used only when its provider is configured.
 */
export const TEMPLATES = {
  otp: (d) => `${d.otp} is your D2C Mall login OTP. Valid for 5 minutes. Do not share it with anyone.`,
  order_confirmed: (d) => `Hi ${d.name}, your D2C Mall order ${d.orderId} is confirmed! Total Rs.${d.total}. Track: ${d.link}`,
  payment_received: (d) => `Payment of Rs.${d.total} received for order ${d.orderId}. Thank you for shopping with D2C Mall.`,
  shipment_created: (d) => `Order ${d.orderId} is packed and ships via ${d.courier} (AWB ${d.awb}). Track: ${d.link}`,
  out_for_delivery: (d) => `Your D2C Mall order ${d.orderId} is out for delivery today. Keep your phone handy!`,
  delivered: (d) => `Delivered! Order ${d.orderId} has reached you. Rate your purchase: ${d.link}`,
  delivery_failed: (d) => `We couldn't deliver order ${d.orderId}. The courier will re-attempt tomorrow.`,
  refund_processed: (d) => `Refund of Rs.${d.amount} for ${d.orderId} has been processed to your ${d.method}.`,
};

export async function sendNotification({ template, data = {}, email, phone, channels = ["email", "sms", "whatsapp"] }) {
  const render = TEMPLATES[template];
  if (!render) return { error: "unknown template" };
  const text = render(data);
  const results = {};
  const tasks = channels.map(async (channel) => {
    try {
      if (channel === "email") {
        if (!process.env.RESEND_API_KEY || !email) return (results.email = "skipped");
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: process.env.EMAIL_FROM || "D2C Mall <orders@d2cmall.in>", to: email, subject: `D2C Mall · ${template.replace(/_/g, " ")}`, text }),
        });
        results.email = r.ok ? "sent" : "failed";
      } else if (channel === "sms") {
        if (!process.env.MSG91_AUTH_KEY || !phone) return (results.sms = "skipped");
        const r = await fetch("https://control.msg91.com/api/v5/flow/", {
          method: "POST",
          headers: { authkey: process.env.MSG91_AUTH_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: template === "otp" ? process.env.MSG91_OTP_TEMPLATE_ID || process.env.MSG91_TEMPLATE_ID : process.env.MSG91_TEMPLATE_ID, recipients: [{ mobiles: `91${phone}`, message: text, otp: data.otp }] }),
        });
        results.sms = r.ok ? "sent" : "failed";
      } else if (channel === "whatsapp") {
        if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID || !phone) return (results.whatsapp = "skipped");
        const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
          body: JSON.stringify({ messaging_product: "whatsapp", to: `91${phone}`, type: "text", text: { body: text } }),
        });
        results.whatsapp = r.ok ? "sent" : "failed";
      }
    } catch {
      results[channel] = "failed";
    }
  });
  await Promise.all(tasks);
  return { text, results };
}
