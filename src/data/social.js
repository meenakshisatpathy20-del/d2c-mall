/*
 * D2C Street — creators, reels and posts with tagged products.
 * Flow: Reel/Post → Shop This Look → tagged products → add to cart.
 */
import { img, imagePools as P, products, seeded } from "./catalog";

export const creators = [
  { id: "cr-aarohi", name: "Aarohi Sharma", handle: "aarohi.styles", city: "Mumbai", avatar: img(P.people[0], 200), followers: 128400, bio: "Minimal fits · thrifted gold · chai", verified: true, niche: "Fashion" },
  { id: "cr-kabir", name: "Kabir Malhotra", handle: "kabir.fits", city: "Delhi", avatar: img(P.people[1], 200), followers: 94200, bio: "Oversized everything. Sneakerhead.", verified: true, niche: "Streetwear" },
  { id: "cr-arjun", name: "Arjun Rao", handle: "arjun.wears", city: "Bengaluru", avatar: img(P.people[2], 200), followers: 51800, bio: "Office to offsite. Linen evangelist.", verified: false, niche: "Menswear" },
  { id: "cr-vikram", name: "Vikram Iyer", handle: "techwithvik", city: "Chennai", avatar: img(P.people[3], 200), followers: 212000, bio: "Gadgets that deserve your money.", verified: true, niche: "Tech" },
  { id: "cr-meher", name: "Meher Kaur", handle: "meher.glows", city: "Chandigarh", avatar: img(P.people[4], 200), followers: 176300, bio: "Skincare nerd · SPF every day", verified: true, niche: "Beauty" },
  { id: "cr-riya", name: "Riya Sen", handle: "riya.ootd", city: "Kolkata", avatar: img(P.people[5], 200), followers: 67200, bio: "Ethnic fusion & festive edits", verified: false, niche: "Ethnic" },
  { id: "cr-zara", name: "Zara Khan", handle: "zara.home", city: "Hyderabad", avatar: img(P.people[6], 200), followers: 88900, bio: "Small homes, big mood.", verified: true, niche: "Home" },
  { id: "cr-ananya", name: "Ananya Joshi", handle: "ananya.jewels", city: "Jaipur", avatar: img(P.people[7], 200), followers: 45100, bio: "Layer it up ✨", verified: false, niche: "Jewellery" },
];

export const getCreator = (id) => creators.find((c) => c.id === id);

const byCat = (cat) => products.filter((p) => p.category === cat);

function pick(list, rnd, n) {
  const copy = [...list];
  const out = [];
  while (copy.length && out.length < n) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  return out;
}

const POSTS = [
  ["cr-aarohi", "reel", P.scenes[2], "3 ways to style one linen co-ord for a whole week ☀️", ["women", "jewellery", "lifestyle"], ["#OOTD", "#LinenSzn", "#CapsuleWardrobe"], "Weekend brunch"],
  ["cr-kabir", "reel", P.scenes[3], "Oversized tee + cargos = the only uniform I need", ["men", "footwear"], ["#Streetwear", "#OversizedFit", "#SneakerHead"], "Street style"],
  ["cr-meher", "reel", P.beauty[2], "My 4-step AM routine for humid Indian summers", ["beauty"], ["#SkincareRoutine", "#SPFeveryday", "#GlowUp"], "Skincare"],
  ["cr-riya", "post", P.women[4], "Festive but make it effortless — block prints all day", ["women", "jewellery"], ["#FestiveEdit", "#HandBlock", "#EthnicFusion"], "Festive"],
  ["cr-vikram", "reel", P.electronics[0], "Best ANC under ₹4K? Honest review after 30 days", ["electronics"], ["#TechReview", "#MadeInIndia", "#ANC"], "Tech"],
  ["cr-zara", "post", P.home[2], "Cosy corner makeover under ₹15K 🛋️", ["home-living"], ["#HomeDecor", "#SmallSpaces", "#CosyCorner"], "Home"],
  ["cr-arjun", "reel", P.men[6], "Linen shirts: office Monday to beach Friday", ["men", "lifestyle"], ["#Menswear", "#LinenShirt", "#WorkWear"], "Workwear"],
  ["cr-ananya", "post", P.jewellery[2], "Gold layering 101 — start with 3 chains", ["jewellery"], ["#LayeredJewellery", "#DemiFine", "#EverydayGold"], "Jewellery"],
  ["cr-aarohi", "ootd", P.women[0], "Crisp white shirt, wide legs & sneakers — Monday sorted", ["women", "footwear"], ["#OOTD", "#WorkFit", "#Minimal"], "Workwear"],
  ["cr-kabir", "ootd", P.men[2], "Graphic tee season is here", ["men", "lifestyle"], ["#OOTD", "#GraphicTee"], "Street style"],
  ["cr-meher", "post", P.beauty[3], "Three lip shades that suit every Indian skin tone 💄", ["beauty"], ["#MakeupTips", "#LipLove"], "Makeup"],
  ["cr-riya", "reel", P.women[7], "Anarkali twirl test — passed ✅", ["women", "jewellery", "footwear"], ["#FestiveEdit", "#Anarkali"], "Festive"],
  ["cr-vikram", "post", P.electronics[3], "The smartwatch that finally replaced my old one", ["electronics", "lifestyle"], ["#Wearables", "#TechTalk"], "Tech"],
  ["cr-zara", "reel", P.home[0], "Warm lighting changes EVERYTHING", ["home-living"], ["#LightingDesign", "#HomeTour"], "Home"],
  ["cr-arjun", "ootd", P.men[5], "Oxford shirt, chinos, loafers — the easy formula", ["men", "footwear"], ["#OOTD", "#SmartCasual"], "Workwear"],
  ["cr-ananya", "reel", P.jewellery[4], "Pearls are back and I'm not complaining", ["jewellery", "women"], ["#Pearls", "#JewelleryHaul"], "Jewellery"],
];

const DAY = 86400000;
const NOW = Date.now();

export const posts = POSTS.map(([creatorId, type, image, caption, cats, hashtags, topic], i) => {
  const rnd = seeded(`post-${i}`);
  const tagged = cats.flatMap((c) => pick(byCat(c), rnd, cats.length === 1 ? 3 : 1));
  return {
    id: `post-${i + 1}`,
    creatorId,
    type,
    image: img(image, 900),
    caption,
    hashtags,
    topic,
    productIds: tagged.map((p) => p.id),
    hotspots: tagged.map((_, k) => ({ x: 22 + ((k * 31 + i * 7) % 56), y: 28 + ((k * 23 + i * 11) % 50) })),
    likes: Math.floor(800 + rnd() * 24000),
    comments: Math.floor(20 + rnd() * 900),
    saves: Math.floor(100 + rnd() * 6000),
    shares: Math.floor(40 + rnd() * 2400),
    views: Math.floor(10000 + rnd() * 480000),
    createdAt: NOW - Math.floor(rnd() * 12 * DAY),
    music: type === "reel" ? ["Original audio", "Kesariya (lofi)", "Tum Se Hi (remix)", "Excuses — AP Dhillon"][i % 4] : null,
    trendingScore: Math.floor(rnd() * 100),
  };
});

export const getPost = (id) => posts.find((p) => p.id === id);

export const seedComments = [
  "Where is this top from?? Need it 😍",
  "Just ordered the same! Arrived in 2 days",
  "The fit looks so good on you",
  "Size guide please — true to size?",
  "Added to cart instantly 🛒",
  "Obsessed with this colour",
  "Can you do a budget version?",
  "This brand never misses",
];

export const trendingHashtags = ["#OOTD", "#FestiveEdit", "#Streetwear", "#SkincareRoutine", "#LinenSzn", "#HomeDecor", "#LayeredJewellery", "#TechReview"];
