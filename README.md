# D2C Mall

India's home for direct-to-consumer brands — a Myntra/Flipkart-class storefront with
social commerce (D2C Street), real-time discovery (D2C Pulse), a multi-warehouse
fulfilment engine, Razorpay payments, Shiprocket logistics, a franchise programme and
a role-based operations console.

**Stack:** React 19 · Vite · React Router · Framer Motion · Three.js (React Three Fiber) ·
Vercel serverless API (Node, zero extra dependencies).

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build → dist/
npm run lint
```

Everything works out of the box with demo data — no keys needed.

| Demo login | ID | Password |
|---|---|---|
| Customer | `demo@d2cmall.in` | `Demo@123` |
| Super Admin | `superadmin@d2cmall.in` | `Admin@123` |
| Warehouse Admin (Bhiwandi only) | `warehouse@d2cmall.in` | `Warehouse@123` |
| Customer Support | `support@d2cmall.in` | `Support@123` |
| Logistics | `logistics@d2cmall.in` | `Logistics@123` |

Admin console: **`/admin`** (login at `/admin/login`). Franchise status demo:
`FR-2026-10233` + `9814012345`.

> Demo data (orders, stock, users) lives in the browser's localStorage so the full flow
> can be demoed without a database. Use the "Reset demo data" option on the error screen
> or clear site data to start fresh.

---

## What's inside (roadmap coverage)

| # | Area | Where |
|---|---|---|
| 1 | Homepage & discovery — hero campaigns, categories, flash deals (live countdown), trending, best sellers, new arrivals, brands, recently viewed & recommendations, SKU search with suggestions & voice, filters/sort, pincode ETA & delivery confidence, trust info, **WebGL discovery galaxy** | `components/home`, `components/shop`, `components/search`, `components/layout` |
| 2 | Product page — zoom gallery, lightbox, variants, stock, MRP/discount/savings, best coupon price, ratings & reviews (fit, photos, write review), specs, similar & also-bought, reels, **Shop the Look**, quick view, wishlist, add to bag / buy now, serviceability | `components/product` |
| 3 | Bag & checkout — stock validation, save for later, coupons (min cart, max discount, expiry, per-user & global limits, category, first-order, payment-method), free-shipping bar, address book, pincode serviceability, **courier selection**, express, ETA, UPI / Cards / NetBanking / Wallets / COD | `components/cart`, `components/checkout`, `lib/pricing.js` |
| 4 | Payment flow — **Checkout → Reserve stock → Create payment order → Razorpay → Server signature verification → Confirm → Create shipment**; failure, retry, cancel/abandon, auto stock release (15-min TTL), idempotency keys | `lib/services/orders.js`, `lib/services/payments.js`, `api/payments/*` |
| 5 | Orders — tabs (All/Processing/Shipped/Out for delivery/Delivered/Cancelled/Returned), search & filters, multi-shipment details, timeline, GST invoice (print/PDF), buy again, review, cancel, return, support tickets | `components/order` |
| 6 | Logistics — shipment creation, AWB, courier assignment, status, NDR/failed delivery & re-attempt, reassignment, hold, live tracking page (polling), Shiprocket API + webhook | `lib/orderModel.js`, `components/order/ShipmentTrackingPage.jsx`, `api/shiprocket/*` |
| 7 | Multi-warehouse — Bhiwandi, Delhi NCR, Jaipur, Bengaluru; allocation by pincode distance, sellable stock (available − reserved), SLA/cut-off, courier coverage, fewest shipments, split shipments | `lib/delivery.js`, `data/logistics.js` |
| 8 | Account — register/login/OTP, protected routes, profile, Home/Work/Other addresses, orders, returns, wishlist, payments & credits, notifications, settings, security & sessions, **Help & support centre** | `components/account` |
| 9 | D2C Street — OOTD & reels feed, creators, follow/like/save/share/comment, UGC upload with product tagging, hotspots, **Reel → Shop This Look → tagged products → bag** | `components/social` |
| 10 | D2C Pulse — trending, fast selling, low stock, highly rated, popular near you, most reordered, new drops, live activity, **WebGL India fulfilment map** | `components/discovery/PulsePage.jsx` |
| 11 | Franchise — ₹11L / ₹21L / ₹51L formats, FOFO/FOCO, ROI & payback calculator, open cities, 5-step application (autosave draft), status tracker; admin kanban with follow-ups, site verification checklist, approve/reject | `components/franchise`, `data/franchise.js` |
| 12 | Admin / Ops — login, RBAC (Super Admin, Warehouse Admin scoped to one hub, Support, Logistics), KPIs & charts, orders, shipments (Shiprocket actions), inventory (available/reserved/sold/threshold, adjust, transfer, reservations, movement audit log), warehouses, returns (QC), customers, team & permissions, CSV exports | `components/admin` |
| 13 | Returns & refunds — item selection, reasons, return vs exchange, pickup slot & address, refund method (original / credits / bank), status tracking, cancel return, QC | `components/order/ReturnsPage.jsx` |
| 14 | Notifications — in-app centre for order/payment/shipment/OFD/delivery/refund events; Email (Resend), SMS (MSG91), WhatsApp (Cloud API) via `/api/notify` | `lib/services/liveSync.js`, `api/notify.js` |
| 15–16 | Backend & security — serverless API, standardized errors, input validation, rate limiting, CORS allowlist, env secrets, scrypt password hashing, JWT + role checks, Razorpay signature & webhook verification, Shiprocket creds server-side, idempotent order creation | `api/` |
| 17 | Deployment — Vercel config + security headers, Dockerfile + nginx, GitHub Actions CI, `.env.example` | root |

---

## Deploy on Vercel

1. Push this repo to GitHub and **Import** it on [vercel.com](https://vercel.com/new).
   Framework preset: **Vite** (auto-detected). Build: `npm run build`, output: `dist`.
2. Add environment variables from `.env.example` (Project → Settings → Environment Variables).
   - For a demo, you can deploy with **no variables** — checkout runs in sandbox mode.
   - For real payments: set `VITE_RAZORPAY_KEY_ID`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
     (use Razorpay **test keys** first), and `RAZORPAY_WEBHOOK_SECRET`.
   - For live shipping: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD` (a Shiprocket API user),
     `SHIPROCKET_WEBHOOK_TOKEN` and your pickup location names.
   - Always set `JWT_SECRET` and `ALLOWED_ORIGINS`.
3. Deploy. `vercel.json` handles SPA routing (`/orders/…` etc.) and security headers;
   files in `/api` become serverless functions automatically.
4. Webhooks:
   - Razorpay Dashboard → Webhooks → `https://<your-app>/api/payments/webhook`
     (events: `payment.captured`, `payment.failed`, `refund.processed`).
   - Shiprocket → Settings → API → Webhooks → `https://<your-app>/api/shiprocket/webhook`
     with header `x-api-key: <SHIPROCKET_WEBHOOK_TOKEN>`.
5. Check `https://<your-app>/api/health` — it reports which integrations are configured.

Local API development: `npm i -g vercel && vercel dev` (runs Vite + `/api` together).

### Docker (static frontend)

```bash
docker build -t d2c-mall --build-arg VITE_RAZORPAY_KEY_ID=rzp_test_xxx .
docker run -p 8080:8080 d2c-mall
```

---

## API reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service & integration status |
| POST | `/api/payments/create-order` | Create Razorpay order `{ amount (paise), receipt, notes }` |
| POST | `/api/payments/verify` | Verify `razorpay_signature` (HMAC-SHA256, timing-safe) |
| POST | `/api/payments/webhook` | Razorpay webhook (raw-body signature check) |
| GET | `/api/shiprocket/serviceability` | Couriers, ETA, rate & COD for a pincode pair |
| POST | `/api/shiprocket/create-shipment` | Create order → assign AWB → schedule pickup (admin JWT) |
| GET | `/api/shiprocket/track?awb=` | Tracking timeline |
| POST | `/api/shiprocket/webhook` | Shiprocket status push |
| POST | `/api/admin/login` | Admin login → JWT with role & warehouse scope |
| POST | `/api/notify` | Email / SMS / WhatsApp notifications (internal token) |

Errors are always `{ "error": { "code", "message", "details?" } }` with proper HTTP status codes.

---

## Architecture

```
src/
  data/        catalogue, logistics network, coupons, social, franchise, seed state
  lib/
    store.js         persistent client store (swap for API calls later)
    pricing.js       coupon & price engine
    delivery.js      serviceability, warehouse allocation, ETA, confidence
    orderModel.js    order & shipment lifecycle (Shiprocket statuses)
    services/        account, inventory, orders, payments, social, franchise, liveSync
  context/     ShopContext (bag, wishlist, pincode, quick view)
  components/  pages & UI, grouped by feature
api/           Vercel serverless functions (payments, shiprocket, auth, notify)
```

The UI only talks to `lib/services/*`. Moving from demo data to a database means
re-implementing those service functions against the API — no page changes needed.

### Hardening before launch (next phase)

- Add a database (Postgres via Neon/Supabase) for products, users, orders, inventory,
  shipments, returns, franchise applications; move reservations to row-level locks.
- Re-price carts server-side in `create-order` and store the Razorpay order ↔ order mapping.
- Move customer auth to `/api/auth/*` (scrypt + JWT helpers already in `api/_lib/auth.js`).
- Replace in-memory rate limiting with Redis (Upstash) for multi-region.
- Swap polling for webhooks + SSE for live tracking.

---

## Notes

- Product photos load from Unsplash; if an image fails, a branded placeholder is shown.
- Franchise figures marked *indicative* (area, margin, payback, royalty) live in
  `src/data/franchise.js` — update them from the final franchise documents.
- WebGL scenes are lazy-loaded, pause when off-screen, respect reduced motion and
  fall back to an image collage if WebGL is unavailable.
