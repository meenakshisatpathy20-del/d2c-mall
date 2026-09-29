/*
 * Fulfilment network, courier partners and pincode geography.
 * Mirrors what the backend Shipment/Warehouse services own in production.
 */

export const warehouses = [
  {
    id: "WH-BHW",
    name: "Mumbai / Bhiwandi Hub",
    short: "Bhiwandi",
    city: "Bhiwandi, Maharashtra",
    pincode: "421302",
    lat: 19.2967,
    lng: 73.0631,
    capacity: 42000,
    slaHours: 18,
    manager: "Rohan Mehta",
    phone: "+91 22 4000 1100",
    cutoff: "2:00 PM",
    color: "#2457ff",
  },
  {
    id: "WH-DEL",
    name: "Delhi NCR Hub",
    short: "Delhi NCR",
    city: "Gurugram, Haryana",
    pincode: "122001",
    lat: 28.4595,
    lng: 77.0266,
    capacity: 38000,
    slaHours: 16,
    manager: "Priya Kapoor",
    phone: "+91 124 400 2200",
    cutoff: "3:00 PM",
    color: "#ff6b00",
  },
  {
    id: "WH-JAI",
    name: "Jaipur Hub",
    short: "Jaipur",
    city: "Jaipur, Rajasthan",
    pincode: "302013",
    lat: 26.9124,
    lng: 75.7873,
    capacity: 18000,
    slaHours: 22,
    manager: "Aditya Shekhawat",
    phone: "+91 141 400 3300",
    cutoff: "1:00 PM",
    color: "#12b76a",
  },
  {
    id: "WH-BLR",
    name: "Bengaluru Hub",
    short: "Bengaluru",
    city: "Hoskote, Karnataka",
    pincode: "562114",
    lat: 13.0707,
    lng: 77.7982,
    capacity: 34000,
    slaHours: 18,
    manager: "Kavya Reddy",
    phone: "+91 80 4000 4400",
    cutoff: "2:30 PM",
    color: "#7f56d9",
  },
];

export const getWarehouse = (id) => warehouses.find((w) => w.id === id);

export const couriers = [
  { id: "bluedart", name: "Blue Dart", speed: 0.75, baseRate: 79, perKg: 38, cod: true, rating: 4.7, express: true },
  { id: "delhivery", name: "Delhivery", speed: 0.9, baseRate: 49, perKg: 26, cod: true, rating: 4.5, express: false },
  { id: "xpressbees", name: "Xpressbees", speed: 1, baseRate: 45, perKg: 24, cod: true, rating: 4.3, express: false },
  { id: "ekart", name: "Ekart", speed: 1, baseRate: 42, perKg: 22, cod: true, rating: 4.2, express: false },
  { id: "shadowfax", name: "Shadowfax", speed: 0.7, baseRate: 59, perKg: 30, cod: false, rating: 4.4, express: true },
  { id: "dtdc", name: "DTDC", speed: 1.2, baseRate: 39, perKg: 20, cod: true, rating: 4.0, express: false },
];

export const getCourier = (id) => couriers.find((c) => c.id === id);

/* Approximate centroids for the first two digits of Indian PIN codes. */
const PIN_REGIONS = {
  11: ["Delhi", 28.61, 77.21],
  12: ["Haryana", 28.9, 76.6],
  13: ["Haryana", 30.0, 76.8],
  14: ["Punjab", 30.9, 75.85],
  15: ["Punjab", 30.3, 74.9],
  16: ["Chandigarh", 30.73, 76.78],
  17: ["Himachal Pradesh", 31.1, 77.17],
  18: ["Jammu & Kashmir", 32.73, 74.86],
  19: ["Jammu & Kashmir / Ladakh", 34.08, 74.8],
  20: ["Uttar Pradesh", 27.2, 78.0],
  21: ["Uttar Pradesh", 25.4, 81.85],
  22: ["Uttar Pradesh", 26.85, 80.95],
  23: ["Uttar Pradesh", 25.3, 83.0],
  24: ["Uttarakhand", 30.3, 78.03],
  25: ["Uttar Pradesh", 26.4, 80.3],
  26: ["Uttarakhand", 29.4, 79.5],
  27: ["Uttar Pradesh", 26.75, 83.37],
  28: ["Uttar Pradesh", 27.88, 78.07],
  30: ["Rajasthan", 26.91, 75.79],
  31: ["Rajasthan", 26.45, 74.64],
  32: ["Rajasthan", 25.18, 75.83],
  33: ["Rajasthan", 28.02, 73.31],
  34: ["Rajasthan", 26.24, 73.02],
  36: ["Gujarat", 22.3, 70.8],
  37: ["Gujarat", 23.0, 70.0],
  38: ["Gujarat", 23.02, 72.57],
  39: ["Gujarat", 21.17, 72.83],
  40: ["Maharashtra", 19.07, 72.88],
  41: ["Maharashtra", 18.52, 73.85],
  42: ["Maharashtra", 20.0, 73.78],
  43: ["Maharashtra", 19.88, 75.34],
  44: ["Maharashtra", 21.15, 79.09],
  45: ["Madhya Pradesh", 22.72, 75.86],
  46: ["Madhya Pradesh", 23.26, 77.41],
  47: ["Madhya Pradesh", 26.22, 78.18],
  48: ["Madhya Pradesh", 23.18, 79.95],
  49: ["Chhattisgarh", 21.25, 81.63],
  50: ["Telangana", 17.39, 78.49],
  51: ["Andhra Pradesh", 15.83, 78.04],
  52: ["Andhra Pradesh", 16.51, 80.65],
  53: ["Andhra Pradesh", 17.69, 83.22],
  56: ["Karnataka", 12.97, 77.59],
  57: ["Karnataka", 12.3, 76.64],
  58: ["Karnataka", 15.36, 75.12],
  59: ["Karnataka", 15.85, 74.5],
  60: ["Tamil Nadu", 13.08, 80.27],
  61: ["Tamil Nadu", 10.8, 78.69],
  62: ["Tamil Nadu", 9.93, 78.12],
  63: ["Tamil Nadu", 11.66, 78.15],
  64: ["Tamil Nadu", 11.0, 76.96],
  67: ["Kerala", 11.26, 75.78],
  68: ["Kerala", 9.93, 76.27],
  69: ["Kerala", 8.52, 76.94],
  70: ["West Bengal", 22.57, 88.36],
  71: ["West Bengal", 22.6, 88.3],
  72: ["West Bengal", 22.3, 87.3],
  73: ["West Bengal", 26.7, 88.4],
  74: ["West Bengal / Andaman", 22.0, 88.0],
  75: ["Odisha", 20.3, 85.82],
  76: ["Odisha", 19.3, 84.8],
  77: ["Odisha", 21.5, 84.0],
  78: ["Assam", 26.14, 91.74],
  79: ["North East", 25.57, 91.88],
  80: ["Bihar", 25.59, 85.14],
  81: ["Bihar", 25.25, 86.98],
  82: ["Jharkhand / Bihar", 24.8, 85.0],
  83: ["Jharkhand", 23.34, 85.31],
  84: ["Bihar", 26.12, 85.39],
  85: ["Bihar", 25.78, 87.47],
};

/* Friendly city names by the first three digits. */
const PIN_CITIES = {
  110: "New Delhi",
  122: "Gurugram",
  121: "Faridabad",
  201: "Noida / Ghaziabad",
  226: "Lucknow",
  208: "Kanpur",
  221: "Varanasi",
  302: "Jaipur",
  313: "Udaipur",
  342: "Jodhpur",
  380: "Ahmedabad",
  395: "Surat",
  390: "Vadodara",
  400: "Mumbai",
  401: "Thane / Palghar",
  411: "Pune",
  421: "Bhiwandi / Kalyan",
  440: "Nagpur",
  452: "Indore",
  462: "Bhopal",
  500: "Hyderabad",
  530: "Visakhapatnam",
  560: "Bengaluru",
  562: "Bengaluru Rural",
  570: "Mysuru",
  600: "Chennai",
  641: "Coimbatore",
  682: "Kochi",
  695: "Thiruvananthapuram",
  700: "Kolkata",
  751: "Bhubaneswar",
  781: "Guwahati",
  800: "Patna",
  831: "Jamshedpur",
  834: "Ranchi",
  141: "Ludhiana",
  160: "Chandigarh",
  143: "Amritsar",
  248: "Dehradun",
  190: "Srinagar",
  194: "Leh",
  744: "Port Blair",
};

export const popularPincodes = [
  { pincode: "110001", city: "New Delhi" },
  { pincode: "400001", city: "Mumbai" },
  { pincode: "560001", city: "Bengaluru" },
  { pincode: "302001", city: "Jaipur" },
  { pincode: "500001", city: "Hyderabad" },
  { pincode: "600001", city: "Chennai" },
  { pincode: "700001", city: "Kolkata" },
  { pincode: "831001", city: "Jamshedpur" },
];

export function lookupPincode(pincode) {
  const pin = String(pincode || "").trim();
  if (!/^[1-8]\d{5}$/.test(pin)) return null;
  const region = PIN_REGIONS[pin.slice(0, 2)];
  if (!region) return null;
  const [state, lat, lng] = region;
  const city = PIN_CITIES[pin.slice(0, 3)] || state;
  return { pincode: pin, city, state, lat, lng };
}

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/* Remote zones where COD or express is not offered. */
export function zoneFlags(pin) {
  const p3 = pin.slice(0, 3);
  const p2 = pin.slice(0, 2);
  const remote = ["194", "744", "737", "790", "791", "792", "795", "796", "797", "798"].includes(p3);
  const special = p2 === "18" || p2 === "19" || p2 === "79" || p3 === "744";
  return { remote, special, codBlocked: remote };
}
