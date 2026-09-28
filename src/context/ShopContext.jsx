/*
 * ShopContext — customer-facing shopping state and actions:
 * cart (with stock validation), save for later, wishlist, recently viewed,
 * delivery pincode, coupons, quick view and drawers.
 */
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getState, setState, useStore } from "../lib/store";
import { productMap } from "../data/catalog";
import { stockOf } from "../lib/services/inventory";
import { computeSummary } from "../lib/pricing";
import { toast } from "../lib/toast";
import { useCurrentUser } from "../lib/services/account";

const ShopContext = createContext(null);

export const cartKey = (item) => `${item.productId}__${item.size || "-"}__${item.color || "-"}`;

export function hydrateLine(line, inventory) {
  const p = productMap[line.productId];
  if (!p) return null;
  const stock = stockOf(p.id, inventory).sellable;
  return {
    ...line,
    key: cartKey(line),
    product: p,
    name: p.name,
    brand: p.brand,
    image: p.images[0],
    category: p.category,
    price: p.price,
    mrp: p.mrp,
    weightKg: p.weightKg,
    stock,
    outOfStock: stock <= 0,
    exceedsStock: line.qty > stock,
  };
}

export function ShopProvider({ children }) {
  const cartLines = useStore((s) => s.cart);
  const savedLines = useStore((s) => s.savedForLater);
  const wishlistIds = useStore((s) => s.wishlist);
  const recentIds = useStore((s) => s.recentlyViewed);
  const inventory = useStore((s) => s.inventory);
  const pincode = useStore((s) => s.pincode);
  const appliedCoupon = useStore((s) => s.appliedCoupon);
  const couponUsage = useStore((s) => s.couponUsage);
  const orders = useStore((s) => s.orders);
  const user = useCurrentUser();

  const [cartOpen, setCartOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState(null);
  const [pincodeOpen, setPincodeOpen] = useState(false);

  const cart = useMemo(() => cartLines.map((l) => hydrateLine(l, inventory)).filter(Boolean), [cartLines, inventory]);
  const savedForLater = useMemo(() => savedLines.map((l) => hydrateLine(l, inventory)).filter(Boolean), [savedLines, inventory]);
  const wishlist = useMemo(() => wishlistIds.map((id) => productMap[id]).filter(Boolean), [wishlistIds]);
  const recentlyViewed = useMemo(() => recentIds.map((id) => productMap[id]).filter(Boolean), [recentIds]);

  const userOrders = useMemo(
    () => (user ? orders.filter((o) => o.userId === user.id && o.status !== "payment_failed" && o.status !== "pending_payment").length : 0),
    [orders, user]
  );
  const usage = useMemo(() => (user ? couponUsage[user.id] || {} : {}), [couponUsage, user]);

  const summary = useMemo(
    () =>
      computeSummary({
        items: cart.filter((i) => !i.outOfStock).map((i) => ({ ...i, qty: Math.min(i.qty, i.stock) })),
        couponCode: appliedCoupon,
        userOrders,
        usage,
      }),
    [cart, appliedCoupon, userOrders, usage]
  );

  /* ---------- cart ---------- */

  const addToCart = useCallback((product, { qty = 1, size = null, color = null, silent = false } = {}) => {
    if (!product) return false;
    if (product.sizes?.length && !size) {
      toast.error("Please select a size first");
      return false;
    }
    const stock = stockOf(product.id, getState().inventory).sellable;
    if (stock <= 0) {
      toast.error("Sorry, this item just went out of stock");
      return false;
    }
    const line = { productId: product.id, size, color: color || product.colors?.[0]?.name || null, qty, addedAt: Date.now() };
    const key = cartKey(line);
    let capped = false;
    setState((st) => {
      const existing = st.cart.find((l) => cartKey(l) === key);
      let nextCart;
      if (existing) {
        const q = Math.min(existing.qty + qty, stock, 10);
        capped = q < existing.qty + qty;
        nextCart = st.cart.map((l) => (cartKey(l) === key ? { ...l, qty: q } : l));
      } else {
        capped = qty > stock;
        nextCart = [...st.cart, { ...line, qty: Math.min(qty, stock, 10) }];
      }
      return { ...st, cart: nextCart };
    });
    if (capped) toast.info(`Only ${stock} left in stock — quantity adjusted`);
    else if (!silent) toast(`Added to bag`, { action: "View bag", onAction: () => setCartOpen(true) });
    return true;
  }, []);

  const buyNow = useCallback((product, opts) => addToCart(product, { ...opts, silent: true }), [addToCart]);

  const updateQty = useCallback((key, qty) => {
    setState((st) => ({
      ...st,
      cart: st.cart.map((l) => {
        if (cartKey(l) !== key) return l;
        const stock = stockOf(l.productId, st.inventory).sellable;
        const q = Math.max(1, Math.min(Number(qty) || 1, stock || 1, 10));
        if (Number(qty) > stock) toast.info(`Only ${stock} available`);
        return { ...l, qty: q };
      }),
    }));
  }, []);

  const changeVariant = useCallback((key, patch) => {
    setState((st) => {
      const line = st.cart.find((l) => cartKey(l) === key);
      if (!line) return st;
      const updated = { ...line, ...patch };
      const others = st.cart.filter((l) => cartKey(l) !== key && cartKey(l) !== cartKey(updated));
      const merged = st.cart.find((l) => cartKey(l) === cartKey(updated) && l !== line);
      return { ...st, cart: [...others, merged ? { ...updated, qty: Math.min(updated.qty + merged.qty, 10) } : updated] };
    });
  }, []);

  const removeFromCart = useCallback((key, { undo = true } = {}) => {
    const line = getState().cart.find((l) => cartKey(l) === key);
    setState((st) => ({ ...st, cart: st.cart.filter((l) => cartKey(l) !== key) }));
    if (line && undo)
      toast("Removed from bag", {
        type: "info",
        action: "Undo",
        onAction: () => setState((st) => ({ ...st, cart: [...st.cart, line] })),
      });
  }, []);

  const saveForLater = useCallback((key) => {
    const line = getState().cart.find((l) => cartKey(l) === key);
    if (!line) return;
    setState((st) => ({
      ...st,
      cart: st.cart.filter((l) => cartKey(l) !== key),
      savedForLater: [line, ...st.savedForLater.filter((l) => cartKey(l) !== key)],
    }));
    toast("Saved for later");
  }, []);

  const moveToCart = useCallback((key) => {
    const line = getState().savedForLater.find((l) => cartKey(l) === key);
    if (!line) return;
    const stock = stockOf(line.productId, getState().inventory).sellable;
    if (stock <= 0) {
      toast.error("This item is out of stock");
      return;
    }
    setState((st) => ({
      ...st,
      savedForLater: st.savedForLater.filter((l) => cartKey(l) !== key),
      cart: [...st.cart.filter((l) => cartKey(l) !== key), { ...line, qty: Math.min(line.qty, stock) }],
    }));
    toast("Moved to bag");
  }, []);

  const removeSaved = useCallback((key) => {
    setState((st) => ({ ...st, savedForLater: st.savedForLater.filter((l) => cartKey(l) !== key) }));
  }, []);

  const clearCart = useCallback(() => setState((st) => ({ ...st, cart: [], appliedCoupon: null })), []);

  /* ---------- wishlist ---------- */

  const isWishlisted = useCallback((id) => wishlistIds.includes(id), [wishlistIds]);

  const toggleWishlist = useCallback((product) => {
    if (!product) return;
    const has = getState().wishlist.includes(product.id);
    setState((st) => ({
      ...st,
      wishlist: has ? st.wishlist.filter((x) => x !== product.id) : [product.id, ...st.wishlist],
    }));
    toast(has ? "Removed from wishlist" : "Saved to wishlist ♥", { type: has ? "info" : "success" });
  }, []);

  const moveWishlistToCart = useCallback(
    (product, opts = {}) => {
      const ok = addToCart(product, opts);
      if (ok) setState((st) => ({ ...st, wishlist: st.wishlist.filter((x) => x !== product.id) }));
      return ok;
    },
    [addToCart]
  );

  /* ---------- recently viewed ---------- */

  const addRecentlyViewed = useCallback((product) => {
    if (!product) return;
    setState((st) =>
      st.recentlyViewed[0] === product.id ? st : { ...st, recentlyViewed: [product.id, ...st.recentlyViewed.filter((x) => x !== product.id)].slice(0, 16) }
    );
  }, []);

  const clearRecentlyViewed = useCallback(() => setState((st) => ({ ...st, recentlyViewed: [] })), []);

  /* ---------- pincode / coupon ---------- */

  const setPincode = useCallback((pin, meta) => {
    setState((st) => ({ ...st, pincode: pin ? { pincode: pin, ...meta } : null }));
  }, []);

  const applyCoupon = useCallback((code) => setState((st) => ({ ...st, appliedCoupon: code ? code.toUpperCase() : null })), []);

  const value = useMemo(
    () => ({
      cart,
      savedForLater,
      wishlist,
      recentlyViewed,
      inventory,
      pincode,
      summary,
      appliedCoupon,
      userOrders,
      usage,
      cartCount: cart.reduce((t, i) => t + i.qty, 0),
      wishlistCount: wishlist.length,
      cartSubtotal: summary.itemTotal,
      cartOpen,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
      quickViewId,
      openQuickView: (id) => setQuickViewId(id),
      closeQuickView: () => setQuickViewId(null),
      pincodeOpen,
      openPincode: () => setPincodeOpen(true),
      closePincode: () => setPincodeOpen(false),
      addToCart,
      buyNow,
      updateQty,
      changeVariant,
      removeFromCart,
      saveForLater,
      moveToCart,
      removeSaved,
      clearCart,
      isWishlisted,
      toggleWishlist,
      moveWishlistToCart,
      removeFromWishlist: (id) => setState((st) => ({ ...st, wishlist: st.wishlist.filter((x) => x !== id) })),
      addRecentlyViewed,
      clearRecentlyViewed,
      setPincode,
      applyCoupon,
    }),
    [cart, savedForLater, wishlist, recentlyViewed, inventory, pincode, summary, appliedCoupon, userOrders, usage, cartOpen, quickViewId, pincodeOpen, addToCart, buyNow, updateQty, changeVariant, removeFromCart, saveForLater, moveToCart, removeSaved, clearCart, isWishlisted, toggleWishlist, moveWishlistToCart, addRecentlyViewed, clearRecentlyViewed, setPincode, applyCoupon]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
