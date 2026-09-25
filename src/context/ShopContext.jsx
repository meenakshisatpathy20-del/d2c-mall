import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ShopContext = createContext(null);

const STORAGE_KEYS = {
  cart: "d2c_cart",
  wishlist: "d2c_wishlist",
  recentlyViewed: "d2c_recently_viewed",
};

function readStorage(key, fallback = []) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }) {
  const [cart, setCart] = useState(() =>
    readStorage(STORAGE_KEYS.cart)
  );

  const [wishlist, setWishlist] = useState(() =>
    readStorage(STORAGE_KEYS.wishlist)
  );

  const [recentlyViewed, setRecentlyViewed] = useState(() =>
    readStorage(STORAGE_KEYS.recentlyViewed)
  );

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.cart,
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.wishlist,
      JSON.stringify(wishlist)
    );
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.recentlyViewed,
      JSON.stringify(recentlyViewed)
    );
  }, [recentlyViewed]);

  /*
   * CART
   */

  const addToCart = (
    product,
    quantity = 1,
    selectedSize = null,
    selectedColor = null
  ) => {
    if (!product?.id) return false;

    const availableStock =
      product.stock ??
      product.availableStock ??
      Infinity;

    if (availableStock <= 0) {
      return false;
    }

    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex(
        (item) =>
          item.id === product.id &&
          item.selectedSize === selectedSize &&
          item.selectedColor === selectedColor
      );

      if (existingIndex === -1) {
        return [
          ...currentCart,
          {
            ...product,
            quantity: Math.min(
              Math.max(quantity, 1),
              availableStock
            ),
            selectedSize,
            selectedColor,
          },
        ];
      }

      return currentCart.map((item, index) => {
        if (index !== existingIndex) {
          return item;
        }

        return {
          ...item,
          quantity: Math.min(
            item.quantity + quantity,
            availableStock
          ),
        };
      });
    });

    setCartOpen(true);
    return true;
  };

  const updateCartQuantity = (cartKey, quantity) => {
    setCart((currentCart) =>
      currentCart
        .map((item) => {
          if (getCartKey(item) !== cartKey) {
            return item;
          }

          const stock =
            item.stock ??
            item.availableStock ??
            Infinity;

          return {
            ...item,
            quantity: Math.min(
              Math.max(Number(quantity) || 1, 1),
              stock
            ),
          };
        })
    );
  };

  const incrementCartItem = (cartKey) => {
    const item = cart.find(
      (entry) => getCartKey(entry) === cartKey
    );

    if (!item) return;

    updateCartQuantity(
      cartKey,
      item.quantity + 1
    );
  };

  const decrementCartItem = (cartKey) => {
    const item = cart.find(
      (entry) => getCartKey(entry) === cartKey
    );

    if (!item) return;

    if (item.quantity <= 1) {
      removeFromCart(cartKey);
      return;
    }

    updateCartQuantity(
      cartKey,
      item.quantity - 1
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => getCartKey(item) !== cartKey
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  /*
   * WISHLIST
   */

  const isWishlisted = (productId) =>
    wishlist.some((item) => item.id === productId);

  const toggleWishlist = (product) => {
    if (!product?.id) return;

    setWishlist((currentWishlist) => {
      const exists = currentWishlist.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return currentWishlist.filter(
          (item) => item.id !== product.id
        );
      }

      return [...currentWishlist, product];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((currentWishlist) =>
      currentWishlist.filter(
        (item) => item.id !== productId
      )
    );
  };

  const moveWishlistToCart = (
    product,
    quantity = 1,
    selectedSize = null,
    selectedColor = null
  ) => {
    const added = addToCart(
      product,
      quantity,
      selectedSize,
      selectedColor
    );

    if (added) {
      removeFromWishlist(product.id);
    }

    return added;
  };

  /*
   * RECENTLY VIEWED
   */

  const addRecentlyViewed = (product) => {
    if (!product?.id) return;

    setRecentlyViewed((current) => {
      const withoutCurrent = current.filter(
        (item) => item.id !== product.id
      );

      return [product, ...withoutCurrent].slice(0, 12);
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewed([]);
  };

  /*
   * CART CALCULATIONS
   */

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartMrpTotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(
            item.mrp ?? item.price ?? 0
          ) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const productSavings = Math.max(
    cartMrpTotal - cartSubtotal,
    0
  );

  const wishlistCount = wishlist.length;

  const contextValue = useMemo(
    () => ({
      /*
       * State
       */
      cart,
      wishlist,
      recentlyViewed,

      cartOpen,
      wishlistOpen,

      /*
       * Drawer controls
       */
      openCart: () => {
        setWishlistOpen(false);
        setCartOpen(true);
      },

      closeCart: () => {
        setCartOpen(false);
      },

      openWishlist: () => {
        setCartOpen(false);
        setWishlistOpen(true);
      },

      closeWishlist: () => {
        setWishlistOpen(false);
      },

      /*
       * Cart
       */
      addToCart,
      updateCartQuantity,
      incrementCartItem,
      decrementCartItem,
      removeFromCart,
      clearCart,

      /*
       * Wishlist
       */
      toggleWishlist,
      isWishlisted,
      removeFromWishlist,
      moveWishlistToCart,

      /*
       * Recently viewed
       */
      addRecentlyViewed,
      clearRecentlyViewed,

      /*
       * Derived values
       */
      cartCount,
      cartSubtotal,
      cartMrpTotal,
      productSavings,
      wishlistCount,
    }),
    [
      cart,
      wishlist,
      recentlyViewed,
      cartOpen,
      wishlistOpen,
      cartCount,
      cartSubtotal,
      cartMrpTotal,
      productSavings,
      wishlistCount,
    ]
  );

  return (
    <ShopContext.Provider value={contextValue}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);

  if (!context) {
    throw new Error(
      "useShop must be used inside ShopProvider"
    );
  }

  return context;
}

function getCartKey(item) {
  return [
    item.id,
    item.selectedSize || "default-size",
    item.selectedColor || "default-color",
  ].join("__");
}