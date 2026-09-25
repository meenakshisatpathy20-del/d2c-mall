export const categories = [
  {
    id: "women",
    name: "Women",
    slug: "women",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "men",
    name: "Men",
    slug: "men",
    image:
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "beauty",
    name: "Beauty",
    slug: "beauty",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "home-living",
    name: "Home & Living",
    slug: "home-living",
    image:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "jewellery",
    name: "Jewellery",
    slug: "jewellery",
    image:
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: "footwear",
    name: "Footwear",
    slug: "footwear",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  },
];

export const heroBanners = [
  {
    id: "hero-001",
    active: true,
    eyebrow: "D2C MALL LIVE",
    title: "Your Style. Your Brands. One Mall.",
    subtitle:
      "Discover fashion, beauty, lifestyle and everyday essentials from India's growing D2C marketplace.",
    desktopImage:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=90",
    mobileImage:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=90",
    alt: "D2C Mall shopping experience",
    badge: "SHOP THE LATEST",
    microcopy: "Free express delivery on orders over ₹499",
    ctas: [
      {
        id: "hero-001-cta-1",
        label: "Shop Now",
        href: "/shop",
        variant: "primary",
      },
      {
        id: "hero-001-cta-2",
        label: "Explore Trends",
        href: "/trending",
        variant: "secondary",
        icon: "sparkle",
      },
    ],
  },
  {
    id: "hero-002",
    active: true,
    eyebrow: "FLASH SALE",
    title: "Up to 50% Off Trending Picks",
    subtitle:
      "The styles everyone's saving, sharing and adding to cart are live now.",
    desktopImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=90",
    mobileImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=90",
    alt: "Fashion sale collection",
    badge: "LIMITED TIME",
    microcopy: "Limited-period offers across selected products",
    ctas: [
      {
        id: "hero-002-cta-1",
        label: "Shop Deals",
        href: "/deals",
        variant: "primary",
      },
      {
        id: "hero-002-cta-2",
        label: "What's Trending",
        href: "/trending",
        variant: "secondary",
      },
    ],
  },
  {
    id: "hero-003",
    active: true,
    eyebrow: "D2C STREET",
    title: "See It. Love It. Shop The Look.",
    subtitle:
      "Discover real styles, creator picks and community trends — then shop everything in the look.",
    desktopImage:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1800&q=90",
    mobileImage:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=90",
    alt: "D2C Street fashion discovery",
    badge: "D2C STREET",
    microcopy: "Discover looks from the D2C community",
    ctas: [
      {
        id: "hero-003-cta-1",
        label: "Explore D2C Street",
        href: "/social",
        variant: "primary",
      },
      {
        id: "hero-003-cta-2",
        label: "Shop Fashion",
        href: "/category/women",
        variant: "secondary",
      },
    ],
  },
  {
    id: "hero-004",
    active: true,
    eyebrow: "NEW ARRIVALS",
    title: "Fresh Drops. Every Week.",
    subtitle:
      "Discover new fashion, beauty, home, electronics and lifestyle finds before everyone else.",
    desktopImage:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1800&q=90",
    mobileImage:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=90",
    alt: "New arrivals",
    badge: "JUST DROPPED",
    microcopy: "New products added regularly",
    ctas: [
      {
        id: "hero-004-cta-1",
        label: "Shop New Arrivals",
        href: "/new-arrivals",
        variant: "primary",
      },
    ],
  },
];

export const products = [
  {
    id: "d2c-women-001",
    sku: "D2C-WMN-001",
    name: "Relaxed Fit Cotton Shirt",
    brand: "D2C Studio",
    category: "women",
    subcategory: "shirts",
    gender: "women",
    price: 899,
    mrp: 1799,
    discount: 50,
    rating: 4.5,
    reviewCount: 328,
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "White",
        value: "#ffffff",
      },
      {
        name: "Blue",
        value: "#315f9f",
      },
      {
        name: "Black",
        value: "#111111",
      },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "A relaxed everyday cotton shirt designed for comfortable all-day wear.",
    highlights: [
      "100% cotton",
      "Relaxed fit",
      "Machine washable",
      "Everyday wear",
    ],
    delivery: {
      estimatedDays: "2–5 days",
      returnDays: 7,
    },
    tags: ["trending", "bestseller", "new"],
  },

  {
    id: "d2c-men-001",
    sku: "D2C-MEN-001",
    name: "Premium Oversized T-Shirt",
    brand: "Urban D2C",
    category: "men",
    subcategory: "t-shirts",
    gender: "men",
    price: 699,
    mrp: 1299,
    discount: 46,
    rating: 4.6,
    reviewCount: 514,
    stock: 27,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "Black",
        value: "#111111",
      },
      {
        name: "White",
        value: "#ffffff",
      },
      {
        name: "Green",
        value: "#54785c",
      },
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    description:
      "Premium oversized cotton tee with a relaxed silhouette for everyday streetwear.",
    highlights: [
      "Premium cotton",
      "Oversized fit",
      "Soft finish",
      "Streetwear inspired",
    ],
    delivery: {
      estimatedDays: "2–4 days",
      returnDays: 7,
    },
    tags: ["trending", "bestseller"],
  },

  {
    id: "d2c-beauty-001",
    sku: "D2C-BEA-001",
    name: "Hydrating Glow Face Serum",
    brand: "GlowLab",
    category: "beauty",
    subcategory: "skincare",
    gender: "unisex",
    price: 549,
    mrp: 899,
    discount: 39,
    rating: 4.7,
    reviewCount: 892,
    stock: 42,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1556229010-aa3c5d3c8d3e?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [],
    sizes: [],
    description:
      "A lightweight hydrating serum formulated for a fresh and healthy-looking glow.",
    highlights: [
      "Hydrating formula",
      "Lightweight texture",
      "Daily skincare",
      "Suitable for all skin types",
    ],
    delivery: {
      estimatedDays: "2–5 days",
      returnDays: 7,
    },
    tags: ["bestseller", "trending"],
  },

  {
    id: "d2c-footwear-001",
    sku: "D2C-FW-001",
    name: "Everyday Street Sneakers",
    brand: "StreetForm",
    category: "footwear",
    subcategory: "sneakers",
    gender: "unisex",
    price: 1499,
    mrp: 2999,
    discount: 50,
    rating: 4.4,
    reviewCount: 241,
    stock: 13,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "Red",
        value: "#c62828",
      },
      {
        name: "White",
        value: "#ffffff",
      },
    ],
    sizes: ["6", "7", "8", "9", "10", "11"],
    description:
      "Versatile everyday sneakers built for casual outfits and city movement.",
    highlights: [
      "Everyday sneakers",
      "Comfort sole",
      "Lightweight construction",
      "Streetwear styling",
    ],
    delivery: {
      estimatedDays: "2–5 days",
      returnDays: 7,
    },
    tags: ["trending", "flash-deal"],
  },

  {
    id: "d2c-jewellery-001",
    sku: "D2C-JWL-001",
    name: "Minimal Gold-Tone Necklace",
    brand: "Lustre",
    category: "jewellery",
    subcategory: "necklaces",
    gender: "women",
    price: 799,
    mrp: 1599,
    discount: 50,
    rating: 4.5,
    reviewCount: 167,
    stock: 21,
    images: [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "Gold",
        value: "#d4af37",
      },
    ],
    sizes: [],
    description:
      "A minimal gold-tone necklace designed to complement everyday looks.",
    highlights: [
      "Minimal design",
      "Lightweight",
      "Everyday styling",
      "Gift-ready",
    ],
    delivery: {
      estimatedDays: "3–6 days",
      returnDays: 7,
    },
    tags: ["new", "trending"],
  },

  {
    id: "d2c-home-001",
    sku: "D2C-HOM-001",
    name: "Modern Accent Table Lamp",
    brand: "CasaForm",
    category: "home-living",
    subcategory: "lighting",
    gender: "unisex",
    price: 1199,
    mrp: 2199,
    discount: 45,
    rating: 4.3,
    reviewCount: 109,
    stock: 9,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1543198126-a8ad8e47fb22?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "Black",
        value: "#111111",
      },
      {
        name: "Cream",
        value: "#e8dcc5",
      },
    ],
    sizes: [],
    description:
      "A modern accent lamp designed to add a warm contemporary touch to your space.",
    highlights: [
      "Modern design",
      "Warm ambient lighting",
      "Compact footprint",
      "Home accent",
    ],
    delivery: {
      estimatedDays: "3–7 days",
      returnDays: 7,
    },
    tags: ["new", "flash-deal"],
  },

  {
    id: "d2c-electronics-001",
    sku: "D2C-ELC-001",
    name: "Wireless Noise-Cancelling Headphones",
    brand: "SoundCore D2C",
    category: "electronics",
    subcategory: "audio",
    gender: "unisex",
    price: 2499,
    mrp: 3999,
    discount: 38,
    rating: 4.6,
    reviewCount: 731,
    stock: 16,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "Black",
        value: "#111111",
      },
      {
        name: "White",
        value: "#f5f5f5",
      },
    ],
    sizes: [],
    description:
      "Wireless headphones designed for immersive listening, calls and everyday travel.",
    highlights: [
      "Wireless audio",
      "Noise cancellation",
      "Long battery life",
      "Built for travel",
    ],
    delivery: {
      estimatedDays: "2–4 days",
      returnDays: 7,
    },
    tags: ["bestseller", "trending"],
  },

  {
    id: "d2c-women-002",
    sku: "D2C-WMN-002",
    name: "Flowy Printed Midi Dress",
    brand: "D2C Edit",
    category: "women",
    subcategory: "dresses",
    gender: "women",
    price: 1299,
    mrp: 2499,
    discount: 48,
    rating: 4.4,
    reviewCount: 286,
    stock: 24,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=900&q=85",
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=85",
    ],
    colors: [
      {
        name: "Pink",
        value: "#d68a9b",
      },
      {
        name: "Blue",
        value: "#5075a6",
      },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    description:
      "A flowy printed midi dress made for easy styling from day plans to evenings out.",
    highlights: [
      "Flowy silhouette",
      "Printed finish",
      "Comfort fabric",
      "Versatile styling",
    ],
    delivery: {
      estimatedDays: "2–5 days",
      returnDays: 7,
    },
    tags: ["new", "bestseller"],
  },
];

export const brands = [
  {
    id: "d2c-studio",
    name: "D2C Studio",
    category: "women",
  },
  {
    id: "urban-d2c",
    name: "Urban D2C",
    category: "men",
  },
  {
    id: "glowlab",
    name: "GlowLab",
    category: "beauty",
  },
  {
    id: "streetform",
    name: "StreetForm",
    category: "footwear",
  },
  {
    id: "lustre",
    name: "Lustre",
    category: "jewellery",
  },
  {
    id: "casaform",
    name: "CasaForm",
    category: "home-living",
  },
];

export function getProductById(id) {
  return products.find(
    (product) => product.id === id
  );
}

export function getProductsByCategory(category) {
  if (!category || category === "all") {
    return products;
  }

  return products.filter(
    (product) => product.category === category
  );
}

export function getProductsByTag(tag) {
  return products.filter((product) =>
    product.tags?.includes(tag)
  );
}

export function searchProducts(query) {
  const normalizedQuery = String(query || "")
    .trim()
    .toLowerCase();

  if (!normalizedQuery) {
    return products;
  }

  return products.filter((product) => {
    const searchableText = [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.sku,
      ...(product.tags || []),
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      normalizedQuery
    );
  });
}

export function sortProducts(
  productList,
  sortBy = "relevance"
) {
  const sorted = [...productList];

  switch (sortBy) {
    case "price-low":
      return sorted.sort(
        (a, b) => a.price - b.price
      );

    case "price-high":
      return sorted.sort(
        (a, b) => b.price - a.price
      );

    case "rating":
      return sorted.sort(
        (a, b) => b.rating - a.rating
      );

    case "discount":
      return sorted.sort(
        (a, b) => b.discount - a.discount
      );

    case "bestselling":
      return sorted.sort(
        (a, b) => b.reviewCount - a.reviewCount
      );

    default:
      return sorted;
  }
}

export function filterProducts(
  productList,
  filters = {}
) {
  const {
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    minDiscount,
    availability,
  } = filters;

  return productList.filter((product) => {
    if (
      category &&
      category !== "all" &&
      product.category !== category
    ) {
      return false;
    }

    if (
      brand &&
      brand !== "all" &&
      product.brand !== brand
    ) {
      return false;
    }

    if (
      minPrice !== undefined &&
      product.price < Number(minPrice)
    ) {
      return false;
    }

    if (
      maxPrice !== undefined &&
      product.price > Number(maxPrice)
    ) {
      return false;
    }

    if (
      minRating !== undefined &&
      product.rating < Number(minRating)
    ) {
      return false;
    }

    if (
      minDiscount !== undefined &&
      product.discount < Number(minDiscount)
    ) {
      return false;
    }

    if (
      availability === "in-stock" &&
      product.stock <= 0
    ) {
      return false;
    }

    if (
      availability === "low-stock" &&
      (product.stock <= 0 ||
        product.stock > 10)
    ) {
      return false;
    }

    return true;
  });
}

export function getTrendingProducts() {
  return getProductsByTag("trending");
}

export function getBestSellingProducts() {
  return getProductsByTag("bestseller");
}

export function getNewArrivals() {
  return getProductsByTag("new");
}

export function getFlashDealProducts() {
  return getProductsByTag("flash-deal");
}