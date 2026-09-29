import { seeded } from "./catalog";

const NAMES = ["Aarav S.", "Diya M.", "Ishaan K.", "Saanvi R.", "Vihaan P.", "Ananya G.", "Kabir T.", "Myra J.", "Reyansh B.", "Aadhya N.", "Arjun V.", "Kiara D.", "Rohan C.", "Tara L.", "Neel A.", "Zoya F."];
const CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Jaipur", "Hyderabad", "Kolkata", "Chennai", "Jamshedpur", "Lucknow"];

const TEXT = {
  positive: [
    ["Exactly as shown", "Quality is premium for the price. Colour is exactly like the pictures and it arrived well packed."],
    ["Worth every rupee", "I was sceptical about a new D2C brand but this is better than the big names. Will reorder."],
    ["Super fast delivery", "Delivered in 2 days from the nearest hub. Packaging was eco-friendly and neat."],
    ["Great finish", "Finishing and stitching are excellent. Feels like a much more expensive product."],
    ["Love it!", "Got so many compliments. Already added another colour to my wishlist."],
  ],
  mixed: [
    ["Good, but runs slightly large", "Nice product overall. I'd suggest going one size down for a snug fit."],
    ["Decent value", "Good for the price, though the colour is a shade lighter than the photos."],
  ],
  negative: [
    ["Not for me", "Quality is fine but it didn't suit me. Return pickup was smooth and the refund came in 3 days."],
  ],
};

export function getReviews(product) {
  if (!product) return { list: [], distribution: [0, 0, 0, 0, 0], fit: null };
  const rnd = seeded(`${product.id}-reviews`);
  const count = 8;
  const list = Array.from({ length: count }, (_, i) => {
    const r = rnd();
    const rating = r < 0.62 ? 5 : r < 0.85 ? 4 : r < 0.94 ? 3 : r < 0.98 ? 2 : 1;
    const bucket = rating >= 4 ? TEXT.positive : rating === 3 ? TEXT.mixed : TEXT.negative;
    const [title, text] = bucket[Math.floor(rnd() * bucket.length)];
    return {
      id: `${product.id}-r${i}`,
      name: NAMES[Math.floor(rnd() * NAMES.length)],
      city: CITIES[Math.floor(rnd() * CITIES.length)],
      rating,
      title,
      text,
      verified: rnd() > 0.15,
      helpful: Math.floor(rnd() * 180),
      size: product.sizes.length ? product.sizes[Math.floor(rnd() * product.sizes.length)] : null,
      withPhoto: i < 3 && rnd() > 0.35 ? product.images[i % product.images.length] : null,
      date: Date.now() - Math.floor(rnd() * 120) * 86400000,
    };
  });

  const total = product.ratingCount;
  const avg = product.rating;
  const w5 = Math.max(0.35, Math.min(0.8, (avg - 3.6) / 1.6));
  const w4 = 0.24;
  const w3 = Math.max(0.03, 0.9 - w5 - w4) * 0.55;
  const w2 = 0.03;
  const w1 = Math.max(0.01, 1 - w5 - w4 - w3 - w2);
  const distribution = [w5, w4, w3, w2, w1].map((w) => Math.round(total * w));

  const fit = product.sizeChart
    ? { small: Math.round(8 + rnd() * 10), true: Math.round(68 + rnd() * 16), large: 0 }
    : null;
  if (fit) fit.large = 100 - fit.small - fit.true;

  return { list, distribution, fit };
}
