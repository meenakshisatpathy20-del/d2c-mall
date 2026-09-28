/*
 * Initial state for the local store: inventory per warehouse, demo customer,
 * admin team, historical orders, returns, franchise applications, etc.
 */
import { products, productMap, seeded } from "./catalog";
import { warehouses } from "./logistics";
import { hashPassword } from "../lib/crypto";
import { buildShipment, newInvoiceNo } from "../lib/orderModel";
import { computeSummary } from "../lib/pricing";

const DAY = 86400000;
const HOUR = 3600000;

function buildInventory() {
  const inv = {};
  products.forEach((p) => {
    const rnd = seeded(`${p.id}-inv`);
    const weights = warehouses.map(() => (rnd() < 0.18 ? 0 : 0.3 + rnd()));
    if (weights.every((w) => w === 0)) weights[0] = 1;
    const sum = weights.reduce((a, b) => a + b, 0);
    inv[p.id] = {};
    let assigned = 0;
    warehouses.forEach((w, i) => {
      const qty = i === warehouses.length - 1 ? Math.max(p.stock - assigned, 0) : Math.floor((p.stock * weights[i]) / sum);
      assigned += qty;
      inv[p.id][w.id] = {
        available: weights[i] === 0 && i !== warehouses.length - 1 ? 0 : qty,
        reserved: 0,
        sold: Math.floor(rnd() * 400),
        threshold: 5,
      };
    });
  });
  return inv;
}

export const DEMO_USER = { email: "demo@d2cmall.in", password: "Demo@123" };

export const ADMIN_ACCOUNTS = [
  { id: "adm-1", name: "Nilay Dubey", email: "superadmin@d2cmall.in", password: "Admin@123", role: "super_admin", warehouseId: null },
  { id: "adm-2", name: "Rohan Mehta", email: "warehouse@d2cmall.in", password: "Warehouse@123", role: "warehouse_admin", warehouseId: "WH-BHW" },
  { id: "adm-3", name: "Sneha Pillai", email: "support@d2cmall.in", password: "Support@123", role: "support", warehouseId: null },
  { id: "adm-4", name: "Imran Qureshi", email: "logistics@d2cmall.in", password: "Logistics@123", role: "logistics", warehouseId: null },
];

const CUSTOMERS = [
  ["Aditi Verma", "aditi.v@gmail.com", "9876501234", "Mumbai", "400050", "Maharashtra"],
  ["Rahul Nair", "rahul.nair@outlook.com", "9812345670", "Bengaluru", "560034", "Karnataka"],
  ["Sanya Gupta", "sanya.g@gmail.com", "9899012345", "New Delhi", "110017", "Delhi"],
  ["Karthik Subramanian", "karthik.s@yahoo.in", "9840123456", "Chennai", "600040", "Tamil Nadu"],
  ["Pooja Agarwal", "pooja.ag@gmail.com", "9829098765", "Jaipur", "302017", "Rajasthan"],
  ["Farhan Ali", "farhan.ali@gmail.com", "9903322110", "Kolkata", "700019", "West Bengal"],
  ["Neha Deshpande", "neha.d@gmail.com", "9822011223", "Pune", "411014", "Maharashtra"],
  ["Vivek Reddy", "vivek.reddy@gmail.com", "9848022334", "Hyderabad", "500081", "Telangana"],
  ["Ishita Banerjee", "ishita.b@gmail.com", "9831044556", "Kolkata", "700091", "West Bengal"],
  ["Manish Tiwari", "manish.t@gmail.com", "9934055667", "Jamshedpur", "831001", "Jharkhand"],
];

function address(name, phone, city, pincode, state, type = "Home") {
  return {
    id: `addr-${pincode}-${type}`,
    name,
    phone,
    line1: type === "Work" ? "4th Floor, Tower B, Business Park" : "Flat 1202, Palm Residency",
    line2: type === "Work" ? "Near Metro Station" : "Main Road, Sector 5",
    landmark: "Opp. City Mall",
    city,
    state,
    pincode,
    type,
    isDefault: type === "Home",
  };
}

function makeOrder({ id, userId, customer, addr, lines, createdAt, method = "upi", stepMs = 14 * HOUR, stopAt = null, failAt = false, cancelled = false, returnState = null, split = false }) {
  const items = lines.map(([pid, qty, size, color], i) => {
    const p = productMap[pid];
    return {
      lineId: `${id}-L${i + 1}`,
      productId: p.id,
      name: p.name,
      brand: p.brand,
      image: p.images[0],
      category: p.category,
      sku: p.sku,
      size: size || null,
      color: color || p.colors[0]?.name || null,
      price: p.price,
      mrp: p.mrp,
      qty,
      returnDays: p.returnDays,
    };
  });
  const summary = computeSummary({ items, paymentMethod: method });
  const whA = warehouses.find((w) => w.city.includes(addr.state)) || warehouses[1];
  const whB = warehouses.find((w) => w.id !== whA.id);
  const groups = split && items.length > 1 ? [[whA, items.slice(0, 1)], [whB, items.slice(1)]] : [[whA, items]];
  const shipments = cancelled
    ? []
    : groups.map(([wh, its], i) =>
        buildShipment({
          id: `SHP${id.slice(-6)}${i + 1}`,
          warehouseId: wh.id,
          courierId: ["delhivery", "bluedart", "xpressbees", "ekart"][(id.charCodeAt(id.length - 1) + i) % 4],
          lineIds: its.map((x) => x.lineId),
          createdAt: createdAt + HOUR,
          destCity: addr.city,
          stepMs,
          etaDays: 3 + i,
          failAtAttempt: failAt && i === 0,
          stopAt,
        })
      );
  const paid = method !== "cod";
  return {
    id,
    userId,
    customer,
    createdAt,
    items,
    address: addr,
    pricing: summary,
    deliverySpeed: "standard",
    status: cancelled ? "cancelled" : "confirmed",
    returnState,
    payment: {
      method,
      status: cancelled ? (paid ? "refunded" : "cancelled") : paid ? "paid" : "cod_pending",
      gateway: paid ? "razorpay" : "cod",
      razorpayOrderId: paid ? `order_${id.slice(-8)}Rz` : null,
      razorpayPaymentId: paid ? `pay_${id.slice(-8)}Pk` : null,
      signatureVerified: paid,
      instrument: { upi: `UPI · ${customer.split(" ")[0].toLowerCase()}@okhdfcbank`, card: "Visa •••• 4242", netbanking: "HDFC NetBanking", cod: "Cash on Delivery" }[method],
      paidAt: paid ? createdAt + 60000 : null,
      attempts: [{ at: createdAt, status: paid ? "success" : "cod" }],
    },
    shipments,
    timeline: [
      { status: "placed", at: createdAt, note: "Order placed" },
      ...(paid ? [{ status: "paid", at: createdAt + 60000, note: "Payment verified (Razorpay signature OK)" }] : []),
      ...(cancelled ? [{ status: "cancelled", at: createdAt + 3 * HOUR, note: "Cancelled by customer — refund initiated" }] : []),
    ],
    invoiceNo: newInvoiceNo(id),
    idempotencyKey: `idem_${id}`,
  };
}

export function createSeedState() {
  const now = Date.now();
  const salt = "demo-salt";
  const demoUserId = "usr-demo";
  const home = address("Nilay Dubey", "9123456780", "Jamshedpur", "831001", "Jharkhand", "Home");
  const work = address("Nilay Dubey", "9123456780", "Bengaluru", "560103", "Karnataka", "Work");
  const parents = { ...address("Sunita Dubey", "9234567801", "New Delhi", "110017", "Delhi", "Other"), label: "Parents' home" };

  const demoOrders = [
    makeOrder({ id: "OD26092811842", userId: demoUserId, customer: "Nilay Dubey", addr: home, createdAt: now - 2 * HOUR, lines: [["men-001", 1, "L", "Black"], ["footwear-001", 1, "UK 9", "White"]], stepMs: 20 * 60000, split: true }),
    makeOrder({ id: "OD26092610231", userId: demoUserId, customer: "Nilay Dubey", addr: home, createdAt: now - 2.2 * DAY, lines: [["electronics-001", 1, null, "Black"]], stepMs: 9 * HOUR, stopAt: "out_for_delivery", method: "card" }),
    makeOrder({ id: "OD26092409917", userId: demoUserId, customer: "Nilay Dubey", addr: work, createdAt: now - 4 * DAY, lines: [["beauty-001", 2], ["beauty-003", 1]], stepMs: 12 * HOUR, failAt: true }),
    makeOrder({ id: "OD26091807765", userId: demoUserId, customer: "Nilay Dubey", addr: home, createdAt: now - 10 * DAY, lines: [["women-002", 1, "M", "Pink"], ["jewellery-002", 1]], stepMs: 12 * HOUR }),
    makeOrder({ id: "OD26090905512", userId: demoUserId, customer: "Nilay Dubey", addr: parents, createdAt: now - 19 * DAY, lines: [["home-living-001", 1, null, "Black"]], method: "cod", stepMs: 14 * HOUR, returnState: "returned" }),
    makeOrder({ id: "OD26090104498", userId: demoUserId, customer: "Nilay Dubey", addr: home, createdAt: now - 27 * DAY, lines: [["lifestyle-002", 1, null, "Black"]], cancelled: true }),
  ];

  const customers = CUSTOMERS.map(([name, email, phone, city, pincode, state], i) => ({
    id: `usr-${i + 1}`,
    name,
    email,
    phone,
    createdAt: now - (30 + i * 23) * DAY,
    addresses: [address(name, phone, city, pincode, state)],
    status: i === 6 ? "blocked" : "active",
    tier: i % 3 === 0 ? "Gold" : i % 3 === 1 ? "Silver" : "Member",
  }));

  const rnd = seeded("admin-orders");
  const otherOrders = [];
  customers.forEach((c, ci) => {
    const count = 1 + Math.floor(rnd() * 3);
    for (let k = 0; k < count; k += 1) {
      const p1 = products[Math.floor(rnd() * products.length)];
      const p2 = products[Math.floor(rnd() * products.length)];
      const age = rnd() * 14 * DAY;
      const lines = [[p1.id, 1, p1.sizes[2] || null], ...(rnd() > 0.5 && p2.id !== p1.id ? [[p2.id, 1, p2.sizes[1] || null]] : [])];
      otherOrders.push(
        makeOrder({
          id: `OD2609${String(20 + ci).padStart(2, "0")}${String(10000 + Math.floor(rnd() * 89999))}`,
          userId: c.id,
          customer: c.name,
          addr: c.addresses[0],
          createdAt: now - age,
          lines,
          method: ["upi", "card", "cod", "netbanking", "upi"][Math.floor(rnd() * 5)],
          stepMs: (6 + rnd() * 10) * HOUR,
          cancelled: rnd() < 0.08,
          failAt: rnd() < 0.08,
          split: rnd() < 0.25,
        })
      );
    }
  });

  const returns = [
    {
      id: "RET26091201",
      orderId: "OD26090905512",
      userId: demoUserId,
      lineIds: ["OD26090905512-L1"],
      type: "return",
      reason: "Product damaged / defective",
      comment: "Lamp shade had a dent on arrival.",
      pickupSlot: "Tomorrow, 10 AM – 2 PM",
      pickupAddressId: parents.id,
      refundMethod: "bank",
      refundAmount: 1499,
      status: "refunded",
      createdAt: now - 14 * DAY,
      timeline: [
        { status: "requested", at: now - 14 * DAY, note: "Return requested" },
        { status: "approved", at: now - 14 * DAY + 2 * HOUR, note: "Return approved" },
        { status: "picked_up", at: now - 12 * DAY, note: "Picked up by Delhivery" },
        { status: "qc_passed", at: now - 10 * DAY, note: "Quality check passed at Delhi NCR Hub" },
        { status: "refund_initiated", at: now - 10 * DAY + HOUR, note: "Refund of ₹1,499 initiated to bank account" },
        { status: "refunded", at: now - 8 * DAY, note: "Refund credited (UTR 612345678901)" },
      ],
    },
  ];

  return {
    version: 3,
    session: null,
    adminSession: null,
    pincode: null,
    cart: [],
    savedForLater: [],
    wishlist: ["women-001", "electronics-003", "jewellery-001"],
    recentlyViewed: [],
    appliedCoupon: null,
    inventory: buildInventory(),
    reservations: [],
    stockMovements: [],
    users: [
      {
        id: demoUserId,
        name: "Nilay Dubey",
        email: DEMO_USER.email,
        phone: "9123456780",
        gender: "Male",
        dob: "1996-04-12",
        salt,
        passwordHash: hashPassword(DEMO_USER.password, salt),
        createdAt: now - 180 * DAY,
        addresses: [home, work, parents],
        savedUpi: ["nilay@okhdfcbank"],
        savedCards: [{ id: "card-1", brand: "Visa", last4: "4242", name: "NILAY DUBEY", expiry: "08/29", bank: "HDFC Bank" }],
        prefs: { orderUpdates: true, offers: true, whatsapp: true, sms: true, email: true, newsletter: false },
        credits: 250,
        sessions: [
          { id: "s1", device: "Chrome on Windows", location: "Jamshedpur, IN", lastActive: now, current: true },
          { id: "s2", device: "D2C Mall app · Android", location: "Bengaluru, IN", lastActive: now - 3 * DAY },
        ],
      },
      ...customers,
    ],
    admins: ADMIN_ACCOUNTS.map((a) => ({ ...a, password: undefined, salt, passwordHash: hashPassword(a.password, salt) })),
    orders: [...demoOrders, ...otherOrders].sort((a, b) => b.createdAt - a.createdAt),
    returns,
    notifications: [
      { id: "n1", userId: demoUserId, type: "shipment", title: "Your headphones are out for delivery", body: "BoltSound Wireless Noise-Cancelling Headphones will reach you today.", link: "/orders/OD26092610231", at: now - 40 * 60000, read: false, channels: ["push", "sms", "whatsapp"] },
      { id: "n2", userId: demoUserId, type: "order", title: "Order confirmed 🎉", body: "Order OD26092811842 is confirmed and split into 2 shipments for faster delivery.", link: "/orders/OD26092811842", at: now - 2 * HOUR, read: false, channels: ["email", "sms", "whatsapp"] },
      { id: "n3", userId: demoUserId, type: "offer", title: "Festive sale: extra 20% off", body: "Use D2C20 on orders above ₹1,499. Ends in 3 days.", link: "/deals", at: now - 6 * HOUR, read: true, channels: ["push"] },
      { id: "n4", userId: demoUserId, type: "refund", title: "Refund credited", body: "₹1,499 for your return RET26091201 has been credited to your bank account.", link: "/returns", at: now - 8 * DAY, read: true, channels: ["email", "sms"] },
    ],
    couponUsage: {},
    social: { likes: {}, saves: {}, follows: { "cr-aarohi": true }, comments: {} },
    userReviews: {},
    franchiseApps: [],
    tickets: [
      { id: "TKT-10231", userId: demoUserId, orderId: "OD26092409917", subject: "Delivery attempt failed but I was home", status: "open", createdAt: now - DAY, messages: [{ from: "customer", text: "The courier marked not reachable but I was home all day.", at: now - DAY }, { from: "support", text: "Sorry about that! We've escalated to Delhivery and scheduled a priority re-attempt for today.", at: now - DAY + 2 * HOUR }] },
    ],
    paymentLog: [],
  };
}
