/*
 * D2C Mall catalogue.
 * This is the single source of product truth for the frontend. When the
 * backend is live, `src/lib/api.js` swaps these reads for API calls with the
 * same shapes.
 */

export const img = (id, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/* ---------- deterministic pseudo-random helpers ---------- */

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seeded(seed) {
  let a = typeof seed === "number" ? seed : hash(String(seed));
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- image pools ---------- */

const P = {
  women: [
    "1594633312681-425c7b97ccd1",
    "1551488831-00ddcb6c6bd3",
    "1515372039744-b8f02a3ae446",
    "1539008835657-9e8e9680c956",
    "1496747611176-843222e1e57c",
    "1515886657613-9f3515b0c78f",
    "1525507119028-ed4c629a60a3",
    "1603252110481-7ba873bf42ab",
    "1483985988355-763728e1935b",
    "1529139574466-a303027c1d8b",
  ],
  men: [
    "1521572163474-6864f9cf17ab",
    "1503341504253-dff4815485f1",
    "1562157873-818bc0726f68",
    "1576566588028-4147f3842f27",
    "1583743814966-8936f37f2096",
    "1627225924765-552d49cf47ad",
    "1617127365659-c47fa864d8bc",
    "1617137968427-85924c800a22",
    "1523398002811-999ca8dec234",
  ],
  beauty: [
    "1620916566398-39f1143ab7be",
    "1556229010-aa3c5d3c8d3e",
    "1596462502278-27bfdc403348",
    "1522335789203-aabd1fc54bc9",
    "1556228453-efd6c1ff04f6",
  ],
  footwear: [
    "1542291026-7eec264c27ff",
    "1549298916-b41d501d3772",
    "1560769629-975ec94e6a86",
    "1606107557195-0e29a4b5b4aa",
    "1595950653106-6c9ebd614d3a",
    "1600185365483-26d7a4cc7519",
  ],
  jewellery: [
    "1599643478518-a784e5dc4c8f",
    "1611652022419-a9419f74343d",
    "1617038260897-41a1f14a8ca0",
    "1515562141207-7a88fb7ce338",
    "1535632066927-ab7c9ab60908",
  ],
  home: [
    "1507473885765-e6ed057f782c",
    "1543198126-a8ad8e47fb22",
    "1616486338812-3dadae4b4ace",
    "1618221195710-dd6b41faaea6",
    "1555041469-a586c61ea9bc",
    "1586023492125-27b2c045efd7",
  ],
  electronics: [
    "1505740420928-5e560c06d30e",
    "1484704849700-f032a568e944",
    "1498049794561-7780e7231661",
    "1523275335684-37898b6baf30",
    "1526170375885-4d8ecf77b99f",
    "1546868871-7041f2a55e12",
  ],
  lifestyle: [
    "1572635196237-14b3f281503f",
    "1553062407-98eeb64c6a62",
    "1548036328-c9fa89d128fa",
    "1590874103328-eac38a683ce7",
    "1511499767150-a48a237f0083",
    "1556228453-efd6c1ff04f6",
  ],
  people: [
    "1494790108377-be9c29b29330",
    "1500648767791-00dcc994a43e",
    "1506794778202-cad84cf45f1d",
    "1507003211169-0a1dd7228f2d",
    "1524504388940-b1c1722653e1",
    "1531123897727-8f129e1688ce",
    "1534528741775-53994a69daeb",
    "1544005313-94ddf0286df2",
  ],
  scenes: [
    "1441986300917-64674bd600d8",
    "1445205170230-053b83016050",
    "1483985988355-763728e1935b",
    "1529139574466-a303027c1d8b",
    "1488426862026-3ee34a7d66df",
  ],
};

export const imagePools = P;

/* ---------- categories ---------- */

export const categories = [
  {
    id: "women",
    name: "Women",
    tagline: "Fresh fashion, everyday essentials and statement pieces.",
    image: img(P.women[8], 900),
    accent: "#ee46bc",
    subcategories: ["Dresses", "Tops", "Shirts", "Kurtas", "Co-ords", "Jeans"],
  },
  {
    id: "men",
    name: "Men",
    tagline: "Oversized tees, sharp shirts and street-ready layers.",
    image: img(P.men[6], 900),
    accent: "#2457ff",
    subcategories: ["T-Shirts", "Shirts", "Jackets", "Trousers", "Hoodies"],
  },
  {
    id: "beauty",
    name: "Beauty",
    tagline: "Clean skincare and makeup from India's cult D2C labels.",
    image: img(P.beauty[2], 900),
    accent: "#f04438",
    subcategories: ["Skincare", "Makeup", "Haircare", "Fragrance"],
  },
  {
    id: "footwear",
    name: "Footwear",
    tagline: "Sneakers, runners and everyday comfort.",
    image: img(P.footwear[0], 900),
    accent: "#ff6b00",
    subcategories: ["Sneakers", "Running", "Casual", "Sliders"],
  },
  {
    id: "jewellery",
    name: "Jewellery",
    tagline: "Demi-fine gold tones, silver and everyday sparkle.",
    image: img(P.jewellery[2], 900),
    accent: "#f79009",
    subcategories: ["Necklaces", "Earrings", "Rings", "Bracelets"],
  },
  {
    id: "home-living",
    name: "Home & Living",
    tagline: "Lighting, decor and furniture that feels like you.",
    image: img(P.home[2], 900),
    accent: "#12b76a",
    subcategories: ["Lighting", "Decor", "Furniture", "Kitchen"],
  },
  {
    id: "electronics",
    name: "Electronics",
    tagline: "Audio, wearables and smart gear from homegrown tech brands.",
    image: img(P.electronics[2], 900),
    accent: "#493cff",
    subcategories: ["Audio", "Wearables", "Cameras", "Accessories"],
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    tagline: "Bags, eyewear and the accessories that finish a look.",
    image: img(P.lifestyle[0], 900),
    accent: "#7f56d9",
    subcategories: ["Bags", "Eyewear", "Travel", "Wellness"],
  },
];

export const getCategory = (id) => categories.find((c) => c.id === id);

/* ---------- brands ---------- */

export const brands = [
  { id: "d2c-studio", name: "D2C Studio", category: "women", city: "Mumbai", founded: 2019, color: "#ee46bc", tagline: "Everyday cotton, beautifully cut." },
  { id: "urban-d2c", name: "Urban D2C", category: "men", city: "Bengaluru", founded: 2018, color: "#2457ff", tagline: "Oversized, heavyweight, street-first." },
  { id: "kora-weaves", name: "Kora Weaves", category: "women", city: "Jaipur", founded: 2016, color: "#c2410c", tagline: "Hand-block prints from Sanganer." },
  { id: "northline", name: "Northline", category: "men", city: "Delhi", founded: 2020, color: "#0f766e", tagline: "Tailored shirts for the long day." },
  { id: "glowlab", name: "GlowLab", category: "beauty", city: "Mumbai", founded: 2019, color: "#f04438", tagline: "Actives that actually work." },
  { id: "bare-botanics", name: "Bare Botanics", category: "beauty", city: "Pune", founded: 2017, color: "#16a34a", tagline: "Clean beauty, Ayurvedic roots." },
  { id: "streetform", name: "StreetForm", category: "footwear", city: "Agra", founded: 2018, color: "#ff6b00", tagline: "Made-in-India sneakers." },
  { id: "stride-co", name: "Stride Co.", category: "footwear", city: "Chennai", founded: 2021, color: "#0ea5e9", tagline: "Engineered for Indian roads." },
  { id: "lustre", name: "Lustre", category: "jewellery", city: "Jaipur", founded: 2017, color: "#f79009", tagline: "Demi-fine, everyday luxe." },
  { id: "silvra", name: "Silvra", category: "jewellery", city: "Hyderabad", founded: 2020, color: "#64748b", tagline: "925 sterling silver, hallmarked." },
  { id: "casaform", name: "CasaForm", category: "home-living", city: "Bengaluru", founded: 2016, color: "#12b76a", tagline: "Design-led homes, honest prices." },
  { id: "ember-home", name: "Ember Home", category: "home-living", city: "Jodhpur", founded: 2019, color: "#b45309", tagline: "Warm light, handcrafted." },
  { id: "boltsound", name: "BoltSound", category: "electronics", city: "Delhi", founded: 2016, color: "#493cff", tagline: "Big sound, desi soul." },
  { id: "pulsewear", name: "PulseWear", category: "electronics", city: "Gurugram", founded: 2019, color: "#111827", tagline: "Smartwatches built for you." },
  { id: "trailpack", name: "TrailPack", category: "lifestyle", city: "Mumbai", founded: 2015, color: "#7f56d9", tagline: "Bags that go everywhere." },
  { id: "shade-co", name: "Shade & Co.", category: "lifestyle", city: "Bengaluru", founded: 2020, color: "#0f172a", tagline: "Polarised eyewear, bold frames." },
];

export const getBrand = (idOrName) =>
  brands.find((b) => b.id === idOrName || b.name === idOrName);

/* ---------- product blueprints ---------- */

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const MEN_SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"];
const RING_SIZES = ["10", "12", "14", "16"];

const C = {
  white: { name: "White", value: "#ffffff" },
  black: { name: "Black", value: "#111111" },
  navy: { name: "Navy", value: "#1f2a55" },
  blue: { name: "Blue", value: "#315f9f" },
  sky: { name: "Sky", value: "#8ec5ff" },
  olive: { name: "Olive", value: "#6b7a3a" },
  beige: { name: "Beige", value: "#d8c3a5" },
  pink: { name: "Pink", value: "#f4a6c1" },
  red: { name: "Red", value: "#d92d20" },
  green: { name: "Green", value: "#2f855a" },
  mustard: { name: "Mustard", value: "#d69e2e" },
  grey: { name: "Grey", value: "#9aa3b2" },
  gold: { name: "Gold", value: "#d4a017" },
  silver: { name: "Silver", value: "#c0c7d1" },
  rose: { name: "Rose Gold", value: "#e0a899" },
  lilac: { name: "Lilac", value: "#b9a3e3" },
  brown: { name: "Brown", value: "#7b4a2d" },
  cream: { name: "Cream", value: "#f3ead8" },
};

// [name, brandId, subcategory, price, mrp, imageIdx[], colors[], tags[]]
const BLUEPRINTS = {
  women: {
    sizes: APPAREL_SIZES,
    material: "Cotton blend",
    items: [
      ["Relaxed Fit Cotton Shirt", "d2c-studio", "Shirts", 899, 1799, [0, 1], [C.white, C.blue, C.black], ["trending", "bestseller", "new"]],
      ["Flowy Printed Midi Dress", "d2c-studio", "Dresses", 1299, 2499, [2, 3], [C.pink, C.blue], ["new", "bestseller"]],
      ["Hand-Block Print Cotton Kurta", "kora-weaves", "Kurtas", 1149, 2299, [3, 6], [C.mustard, C.blue, C.pink], ["trending", "reordered"]],
      ["Linen Co-ord Set", "d2c-studio", "Co-ords", 2199, 3999, [4, 5], [C.beige, C.olive, C.white], ["new", "flash-deal"]],
      ["Ribbed Crop Top", "d2c-studio", "Tops", 499, 999, [5, 8], [C.black, C.white, C.lilac], ["fast-selling", "flash-deal"]],
      ["High-Rise Wide Leg Jeans", "d2c-studio", "Jeans", 1599, 2799, [6, 9], [C.blue, C.sky], ["bestseller"]],
      ["Anarkali Festive Kurta Set", "kora-weaves", "Kurtas", 2899, 5999, [7, 3], [C.red, C.green], ["trending", "flash-deal"]],
      ["Satin Slip Dress", "d2c-studio", "Dresses", 1799, 3299, [8, 2], [C.black, C.rose], ["new", "trending"]],
      ["Oversized Boyfriend Shirt", "kora-weaves", "Shirts", 999, 1999, [9, 0], [C.sky, C.white], ["reordered"]],
      ["Chikankari Straight Kurta", "kora-weaves", "Kurtas", 1699, 3199, [1, 7], [C.white, C.pink], ["bestseller", "reordered"]],
    ],
  },
  men: {
    sizes: MEN_SIZES,
    material: "100% cotton",
    items: [
      ["Premium Oversized T-Shirt", "urban-d2c", "T-Shirts", 699, 1299, [0, 1], [C.black, C.white, C.olive], ["trending", "bestseller", "reordered"]],
      ["Heavyweight Graphic Tee", "urban-d2c", "T-Shirts", 799, 1499, [3, 2], [C.white, C.black], ["trending", "fast-selling"]],
      ["Oxford Button-Down Shirt", "northline", "Shirts", 1299, 2499, [5, 6], [C.sky, C.white, C.navy], ["bestseller"]],
      ["Utility Overshirt Jacket", "urban-d2c", "Jackets", 2199, 3999, [6, 7], [C.olive, C.beige], ["new", "trending"]],
      ["Relaxed Cargo Trousers", "urban-d2c", "Trousers", 1499, 2699, [7, 8], [C.beige, C.black, C.olive], ["new", "flash-deal"]],
      ["Solid Regular Fit Polo", "northline", "T-Shirts", 649, 1199, [4, 0], [C.navy, C.green, C.white], ["reordered", "bestseller"]],
      ["Linen Resort Shirt", "northline", "Shirts", 1499, 2799, [2, 5], [C.beige, C.white], ["new"]],
      ["Brushed Fleece Hoodie", "urban-d2c", "Hoodies", 1599, 2999, [8, 1], [C.grey, C.black, C.navy], ["flash-deal", "fast-selling"]],
      ["Slim Stretch Chinos", "northline", "Trousers", 1199, 2199, [1, 4], [C.beige, C.navy, C.olive], ["bestseller"]],
    ],
  },
  beauty: {
    sizes: [],
    material: "Dermatologically tested",
    items: [
      ["Hydrating Glow Face Serum", "glowlab", "Skincare", 549, 899, [0, 1], [], ["trending", "bestseller", "reordered"]],
      ["10% Niacinamide Serum", "glowlab", "Skincare", 499, 799, [1, 4], [], ["bestseller", "reordered", "fast-selling"]],
      ["SPF 50 Invisible Sunscreen", "glowlab", "Skincare", 449, 699, [4, 0], [], ["trending", "reordered"]],
      ["Matte Liquid Lipstick Trio", "bare-botanics", "Makeup", 699, 1299, [3, 2], [C.red, C.pink, C.brown], ["new", "flash-deal"]],
      ["Kumkumadi Night Face Oil", "bare-botanics", "Skincare", 899, 1499, [2, 1], [], ["bestseller"]],
      ["Onion & Bhringraj Hair Oil", "bare-botanics", "Haircare", 349, 599, [4, 2], [], ["reordered", "fast-selling"]],
      ["Oud & Amber Eau de Parfum", "bare-botanics", "Fragrance", 1299, 2499, [1, 3], [], ["new", "trending"]],
      ["Ceramide Barrier Moisturiser", "glowlab", "Skincare", 599, 999, [0, 4], [], ["new", "reordered"]],
    ],
  },
  footwear: {
    sizes: SHOE_SIZES,
    material: "Knit upper, EVA sole",
    items: [
      ["Everyday Street Sneakers", "streetform", "Sneakers", 1999, 3999, [0, 1], [C.red, C.white], ["trending", "flash-deal", "bestseller"]],
      ["Classic White Court Sneakers", "streetform", "Sneakers", 2299, 3999, [1, 3], [C.white, C.black], ["bestseller", "reordered"]],
      ["CloudRun Performance Runners", "stride-co", "Running", 2799, 4999, [2, 4], [C.grey, C.blue], ["new", "trending"]],
      ["Retro High-Top Sneakers", "streetform", "Sneakers", 2499, 4499, [3, 5], [C.black, C.red], ["new"]],
      ["Everyday Slip-On Loafers", "stride-co", "Casual", 1499, 2699, [4, 0], [C.brown, C.black], ["fast-selling"]],
      ["Cushioned Sliders", "stride-co", "Sliders", 599, 1199, [5, 2], [C.black, C.olive], ["flash-deal", "reordered"]],
      ["Trail Grip Outdoor Shoes", "stride-co", "Running", 3199, 5499, [2, 5], [C.olive, C.grey], ["new"]],
    ],
  },
  jewellery: {
    sizes: [],
    material: "18K gold plated brass",
    items: [
      ["Minimal Gold-Tone Necklace", "lustre", "Necklaces", 899, 1799, [0, 1], [C.gold, C.silver], ["trending", "flash-deal"]],
      ["Pearl Drop Earrings", "lustre", "Earrings", 649, 1299, [4, 2], [C.gold], ["bestseller", "new"]],
      ["Layered Coin Chain", "lustre", "Necklaces", 1099, 2199, [1, 3], [C.gold], ["trending"]],
      ["Sterling Silver Stacking Rings", "silvra", "Rings", 1299, 2199, [3, 0], [C.silver, C.rose], ["new", "reordered"]],
      ["Kundan Statement Choker", "lustre", "Necklaces", 1899, 3999, [2, 4], [C.gold], ["flash-deal", "trending"]],
      ["925 Silver Tennis Bracelet", "silvra", "Bracelets", 2499, 3999, [0, 3], [C.silver], ["bestseller"]],
      ["Huggie Hoop Earrings", "silvra", "Earrings", 799, 1399, [4, 1], [C.gold, C.silver], ["fast-selling", "reordered"]],
    ],
  },
  "home-living": {
    sizes: [],
    material: "Metal & fabric",
    items: [
      ["Modern Accent Table Lamp", "ember-home", "Lighting", 1499, 2499, [0, 1], [C.black, C.cream], ["new", "flash-deal"]],
      ["Ceramic Vase Set of 3", "casaform", "Decor", 1199, 1999, [1, 3], [C.cream, C.beige], ["trending"]],
      ["Boucle Accent Chair", "casaform", "Furniture", 8999, 14999, [2, 4], [C.cream, C.grey], ["new", "bestseller"]],
      ["Rattan Pendant Light", "ember-home", "Lighting", 2199, 3999, [3, 0], [C.beige], ["trending"]],
      ["3-Seater Linen Sofa", "casaform", "Furniture", 24999, 39999, [4, 5], [C.beige, C.grey, C.olive], ["bestseller"]],
      ["Handwoven Cotton Throw", "ember-home", "Decor", 999, 1799, [5, 2], [C.mustard, C.cream], ["reordered", "fast-selling"]],
      ["Stoneware Dinner Set (12 pc)", "casaform", "Kitchen", 2499, 4499, [1, 5], [C.cream, C.blue], ["flash-deal", "reordered"]],
    ],
  },
  electronics: {
    sizes: [],
    material: "ABS & aluminium",
    items: [
      ["Wireless Noise-Cancelling Headphones", "boltsound", "Audio", 3499, 7999, [0, 1], [C.black, C.white], ["trending", "bestseller", "flash-deal"]],
      ["Studio Over-Ear Headphones", "boltsound", "Audio", 2499, 4999, [1, 0], [C.black, C.blue], ["fast-selling"]],
      ["Minimal Analog Smartwatch", "pulsewear", "Wearables", 2999, 5999, [3, 5], [C.black, C.silver, C.rose], ["new", "trending"]],
      ["AMOLED Fitness Smartwatch", "pulsewear", "Wearables", 1999, 4999, [5, 3], [C.black, C.navy], ["bestseller", "flash-deal", "reordered"]],
      ["Retro Instant Camera", "boltsound", "Cameras", 5499, 7999, [4, 2], [C.cream, C.black], ["new"]],
      ["Laptop Workstation Bundle", "boltsound", "Accessories", 4499, 6999, [2, 4], [C.grey], ["trending"]],
      ["TWS Earbuds with ANC", "boltsound", "Audio", 1799, 4499, [0, 5], [C.white, C.black], ["fast-selling", "reordered", "new"]],
    ],
  },
  lifestyle: {
    sizes: [],
    material: "Vegan leather & recycled nylon",
    items: [
      ["Polarised Aviator Sunglasses", "shade-co", "Eyewear", 1299, 2599, [0, 4], [C.gold, C.black], ["trending", "flash-deal"]],
      ["Everyday Laptop Backpack", "trailpack", "Bags", 1899, 3499, [1, 3], [C.black, C.grey, C.olive], ["bestseller", "reordered"]],
      ["Structured Tote Bag", "trailpack", "Bags", 1599, 2999, [2, 3], [C.brown, C.beige, C.black], ["new", "trending"]],
      ["Mini Crossbody Sling", "trailpack", "Bags", 999, 1999, [3, 2], [C.pink, C.black], ["fast-selling", "new"]],
      ["Round Retro Sunglasses", "shade-co", "Eyewear", 999, 1999, [4, 0], [C.black, C.brown], ["bestseller"]],
      ["Cabin Trolley 55cm", "trailpack", "Travel", 3999, 7499, [1, 5], [C.navy, C.grey], ["flash-deal"]],
      ["Aroma Diffuser & Oil Kit", "bare-botanics", "Wellness", 1299, 2199, [5, 1], [C.cream], ["reordered", "new"]],
    ],
  },
};

const DESCRIPTIONS = {
  women: "Cut from breathable fabric with a relaxed drape, this piece moves from desk to dinner without a second thought. Finished with clean seams and a true-to-size fit.",
  men: "Built from heavyweight, bio-washed fabric with a structured drape that holds its shape wash after wash. Designed in-house and made in Tiruppur.",
  beauty: "Formulated with clinically proven actives at effective concentrations. Fragrance-free, non-comedogenic and suitable for Indian skin and weather.",
  footwear: "A cushioned, lightweight sole with an ergonomic footbed made for all-day wear on Indian streets. Breathable upper keeps feet cool in the heat.",
  jewellery: "Anti-tarnish, nickel-free and skin-safe. Every piece is hand-finished by artisans and arrives in a gift-ready box with a care pouch.",
  "home-living": "Designed in India and crafted by small-batch makers. Sustainably sourced materials and a finish that ages beautifully in any home.",
  electronics: "Engineered and tuned in India with a 1-year brand warranty. Fast charging, low-latency Bluetooth 5.3 and a companion app with regular updates.",
  lifestyle: "Water-resistant, lightweight and built to carry your everyday. Padded compartments, premium zips and a 1-year warranty against defects.",
};

const HIGHLIGHTS = {
  women: ["Breathable fabric", "Relaxed fit", "Machine washable", "Made in India"],
  men: ["240 GSM heavyweight", "Pre-shrunk", "Bio-washed for softness", "Made in Tiruppur"],
  beauty: ["Dermatologist tested", "Cruelty-free", "Paraben & sulphate free", "Suits all skin types"],
  footwear: ["Cushioned EVA sole", "Breathable upper", "Anti-skid grip", "6-month warranty"],
  jewellery: ["Anti-tarnish coating", "Nickel & lead free", "Hypoallergenic", "Gift-ready packaging"],
  "home-living": ["Handcrafted", "Sustainably sourced", "Easy to clean", "Assembly support included"],
  electronics: ["1-year warranty", "Bluetooth 5.3", "Fast charging", "Made in India"],
  lifestyle: ["Water resistant", "Lightweight build", "Premium hardware", "1-year warranty"],
};

const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Jaipur", "Hyderabad", "Pune", "Chennai", "Kolkata"];
const NOW = Date.UTC(2026, 8, 28, 12, 0, 0);

function buildProducts() {
  const list = [];
  Object.entries(BLUEPRINTS).forEach(([category, bp]) => {
    const pool = P[category === "home-living" ? "home" : category];
    bp.items.forEach((item, index) => {
      const [name, brandId, sub, price, mrp, imgIdx, colors, tags] = item;
      const n = String(index + 1).padStart(3, "0");
      const id = `${category}-${n}`;
      const rnd = seeded(id);
      const brand = getBrand(brandId);
      const rating = Math.round((3.9 + rnd() * 1) * 10) / 10;
      const ratingCount = Math.floor(120 + rnd() * 4800);
      const stock = tags.includes("fast-selling") ? Math.floor(3 + rnd() * 7) : Math.floor(8 + rnd() * 90);
      const extra = pool[(imgIdx[1] + 1 + index) % pool.length];
      const images = [...new Set([...imgIdx.map((i) => pool[i % pool.length]), extra])].map((pid) => img(pid, 900));
      const isApparel = category === "women" || category === "men";
      const sizes = sub === "Rings" ? RING_SIZES : bp.sizes;
      // Deterministically mark a size or two as sold out for realism
      const soldOutSizes = sizes.length ? sizes.filter((_, i) => rnd() < 0.12 && i !== 2) : [];
      list.push({
        id,
        sku: `D2C-${category.slice(0, 3).toUpperCase()}-${n}`,
        name,
        brand: brand.name,
        brandId,
        category,
        subcategory: sub,
        price,
        mrp,
        discount: Math.round(((mrp - price) / mrp) * 100),
        rating,
        ratingCount,
        reviewCount: Math.floor(ratingCount / 6),
        stock,
        images,
        colors,
        sizes,
        soldOutSizes,
        sizeChart: isApparel,
        material: bp.material,
        description: `${DESCRIPTIONS[category]}`,
        highlights: HIGHLIGHTS[category],
        specs: {
          Brand: brand.name,
          Material: bp.material,
          Category: sub,
          "Country of origin": "India",
          "Sold by": `${brand.name} (Verified D2C seller)`,
          SKU: `D2C-${category.slice(0, 3).toUpperCase()}-${n}`,
        },
        returnDays: category === "beauty" ? 0 : category === "electronics" ? 7 : 14,
        exchange: isApparel || category === "footwear",
        cod: price < 20000,
        tags,
        createdAt: NOW - Math.floor(rnd() * 60) * 86400000,
        soldLast24h: Math.floor(20 + rnd() * (tags.includes("fast-selling") ? 900 : 300)),
        viewingNow: Math.floor(8 + rnd() * 140),
        reorderRate: Math.floor(tags.includes("reordered") ? 38 + rnd() * 30 : 8 + rnd() * 20),
        popularIn: [CITIES[Math.floor(rnd() * CITIES.length)], CITIES[Math.floor(rnd() * CITIES.length)]].filter((v, i, a) => a.indexOf(v) === i),
        weightKg: category === "home-living" && price > 5000 ? 18 : category === "home-living" ? 1.6 : 0.5,
      });
    });
  });
  return list;
}

export const products = buildProducts();

export const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

/* ---------- lookups & queries ---------- */

export function getProductById(id) {
  return productMap[id];
}

export function getProductsByCategory(category) {
  if (!category || category === "all") return products;
  return products.filter((p) => p.category === category);
}

export function getProductsByTag(tag) {
  return products.filter((p) => p.tags.includes(tag));
}

export function getProductsByBrand(brandId) {
  return products.filter((p) => p.brandId === brandId);
}

export const getTrendingProducts = () => getProductsByTag("trending");
export const getBestSellingProducts = () =>
  [...getProductsByTag("bestseller")].sort((a, b) => b.ratingCount - a.ratingCount);
export const getNewArrivals = () =>
  [...getProductsByTag("new")].sort((a, b) => b.createdAt - a.createdAt);
export const getFlashDealProducts = () =>
  [...getProductsByTag("flash-deal")].sort((a, b) => b.discount - a.discount);

export function getSimilarProducts(product, limit = 12) {
  if (!product) return [];
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => {
      const sa = (a.subcategory === product.subcategory ? 2 : 0) + (a.brandId === product.brandId ? 1 : 0);
      const sb = (b.subcategory === product.subcategory ? 2 : 0) + (b.brandId === product.brandId ? 1 : 0);
      return sb - sa || b.rating - a.rating;
    })
    .slice(0, limit);
}

const COMPLEMENTS = {
  women: ["jewellery", "footwear", "lifestyle"],
  men: ["footwear", "lifestyle", "electronics"],
  beauty: ["beauty", "lifestyle"],
  footwear: ["men", "women", "lifestyle"],
  jewellery: ["women", "beauty"],
  "home-living": ["home-living", "lifestyle"],
  electronics: ["electronics", "lifestyle"],
  lifestyle: ["women", "men", "footwear"],
};

export function getCompleteTheLook(product, limit = 3) {
  if (!product) return [];
  const cats = COMPLEMENTS[product.category] || [];
  const rnd = seeded(`${product.id}-look`);
  return cats
    .map((cat) => {
      const pool = products.filter((p) => p.category === cat && p.id !== product.id);
      return pool[Math.floor(rnd() * pool.length)];
    })
    .filter(Boolean)
    .slice(0, limit);
}

export function searchProducts(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return products;
  const terms = q.split(/\s+/);
  return products
    .map((p) => {
      const hay = [p.name, p.brand, p.category, p.subcategory, p.sku, ...p.tags, ...p.colors.map((c) => c.name)]
        .join(" ")
        .toLowerCase();
      let score = 0;
      terms.forEach((t) => {
        if (p.sku.toLowerCase() === t) score += 50;
        if (p.name.toLowerCase().includes(t)) score += 6;
        if (p.brand.toLowerCase().includes(t)) score += 5;
        if (p.subcategory.toLowerCase().includes(t)) score += 4;
        if (hay.includes(t)) score += 1;
      });
      const all = terms.every((t) => hay.includes(t));
      return { p, score: all ? score : 0 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

export function getSearchSuggestions(query, limit = 6) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return { products: [], brands: [], categories: [] };
  return {
    products: searchProducts(q).slice(0, limit),
    brands: brands.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 3),
    categories: categories
      .flatMap((c) => [{ id: c.id, label: c.name }, ...c.subcategories.map((s) => ({ id: c.id, sub: s, label: `${s} in ${c.name}` }))])
      .filter((c) => c.label.toLowerCase().includes(q))
      .slice(0, 4),
  };
}

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "popularity", label: "Popularity" },
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "discount", label: "Better discount" },
  { value: "rating", label: "Customer rating" },
];

export function sortProducts(list, sortBy = "relevance") {
  const s = [...list];
  switch (sortBy) {
    case "price-low": return s.sort((a, b) => a.price - b.price);
    case "price-high": return s.sort((a, b) => b.price - a.price);
    case "rating": return s.sort((a, b) => b.rating - a.rating);
    case "discount": return s.sort((a, b) => b.discount - a.discount);
    case "newest": return s.sort((a, b) => b.createdAt - a.createdAt);
    case "popularity": return s.sort((a, b) => b.soldLast24h - a.soldLast24h);
    default: return s;
  }
}

export const PRICE_BUCKETS = [
  { id: "0-999", label: "Under ₹999", min: 0, max: 999 },
  { id: "1000-1999", label: "₹1,000 – ₹1,999", min: 1000, max: 1999 },
  { id: "2000-4999", label: "₹2,000 – ₹4,999", min: 2000, max: 4999 },
  { id: "5000-up", label: "₹5,000 & above", min: 5000, max: Infinity },
];

export function filterProducts(list, f = {}) {
  return list.filter((p) => {
    if (f.categories?.length && !f.categories.includes(p.category)) return false;
    if (f.subcategories?.length && !f.subcategories.includes(p.subcategory)) return false;
    if (f.brands?.length && !f.brands.includes(p.brandId)) return false;
    if (f.colors?.length && !p.colors.some((c) => f.colors.includes(c.name))) return false;
    if (f.sizes?.length && !p.sizes.some((s) => f.sizes.includes(s))) return false;
    if (f.prices?.length) {
      const ok = f.prices.some((id) => {
        const b = PRICE_BUCKETS.find((x) => x.id === id);
        return b && p.price >= b.min && p.price <= b.max;
      });
      if (!ok) return false;
    }
    if (f.minRating && p.rating < f.minRating) return false;
    if (f.minDiscount && p.discount < f.minDiscount) return false;
    if (f.inStock && p.stock <= 0) return false;
    if (f.cod && !p.cod) return false;
    return true;
  });
}

/* ---------- hero campaigns ---------- */

export const heroBanners = [
  {
    id: "hero-festive",
    eyebrow: "The Big D2C Festive Sale",
    title: "India's best D2C brands. One mall.",
    highlight: "Up to 70% off",
    subtitle: "240+ verified homegrown brands, shipped from 4 hubs across India with delivery in as fast as 24 hours.",
    image: img(P.scenes[0], 1600),
    theme: "navy",
    ctas: [
      { label: "Shop the sale", href: "/deals" },
      { label: "Explore trends", href: "/trending", variant: "glass" },
    ],
    stats: [["240+", "D2C brands"], ["4", "fulfilment hubs"], ["24h", "express delivery"]],
  },
  {
    id: "hero-street",
    eyebrow: "D2C Street",
    title: "See it. Love it. Shop the look.",
    highlight: "Creator-picked",
    subtitle: "Real people, real fits. Tap any reel to shop every tagged piece in a single click.",
    image: img(P.scenes[3], 1600),
    theme: "purple",
    ctas: [
      { label: "Explore D2C Street", href: "/d2c-street" },
      { label: "Watch reels", href: "/social", variant: "glass" },
    ],
    stats: [["18K", "looks shared"], ["1-tap", "shop the look"], ["4.8★", "creator rating"]],
  },
  {
    id: "hero-new",
    eyebrow: "Fresh drops every Friday",
    title: "New arrivals, first dibs.",
    highlight: "Just landed",
    subtitle: "Limited-edition drops from India's fastest-growing labels. Once they're gone, they're gone.",
    image: img(P.scenes[1], 1600),
    theme: "orange",
    ctas: [
      { label: "Shop new arrivals", href: "/new-arrivals" },
      { label: "D2C Pulse", href: "/pulse", variant: "glass" },
    ],
    stats: [["120+", "new styles"], ["Weekly", "drops"], ["Early", "access"]],
  },
];

/* ---------- bank offers (listing / PDP / checkout) ---------- */

export const bankOffers = [
  { id: "hdfc", bank: "HDFC Bank", text: "10% instant discount on HDFC Credit Cards, up to ₹1,500 on orders above ₹3,999", code: "HDFC10" },
  { id: "icici", bank: "ICICI Bank", text: "7.5% off on ICICI Bank Debit & Credit Card EMI, up to ₹1,000", code: "ICICIEMI" },
  { id: "upi", bank: "UPI", text: "Flat ₹50 cashback on your first UPI payment above ₹499", code: "UPI50" },
  { id: "paylater", bank: "Simpl", text: "Pay in 3 with Simpl — 0% interest, no cost EMI", code: null },
];
