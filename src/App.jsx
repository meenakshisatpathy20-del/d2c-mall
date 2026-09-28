import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ShopProvider } from "./context/ShopContext";
import MainHeader, { MobileTabBar } from "./components/layout/MainHeader";
import SiteFooter from "./components/layout/SiteFooter";
import CartDrawer from "./components/cart/CartDrawer";
import ProductQuickView from "./components/product/ProductQuickView";
import SandboxGateway from "./components/checkout/SandboxGateway";
import { PincodeModal } from "./components/common/DeliveryChecker";
import { Toaster } from "./components/common/ui";
import HomePage from "./components/home/HomePage";
import { useLiveSync } from "./lib/services/liveSync";
import { useCurrentUser } from "./lib/services/account";
import "./App.css";

const ShopPage = lazy(() => import("./components/shop/ShopPage"));
const SearchResultsPage = lazy(() => import("./components/search/SearchResultsPage"));
const CategoryLandingPage = lazy(() => import("./components/category/CategoryLandingPage"));
const ProductDetailsPage = lazy(() => import("./components/product/ProductDetailsPage"));
const WishlistPage = lazy(() => import("./components/wishlist/WishlistPage"));
const CartPage = lazy(() => import("./components/cart/CartPage"));
const CheckoutPage = lazy(() => import("./components/checkout/CheckoutPage"));
const OrdersPage = lazy(() => import("./components/order/OrdersPage"));
const OrderDetailsPage = lazy(() => import("./components/order/OrderDetailsPage"));
const ShipmentTrackingPage = lazy(() => import("./components/order/ShipmentTrackingPage"));
const ReturnsPage = lazy(() => import("./components/order/ReturnsPage"));
const OrderSuccessPage = lazy(() => import("./components/order/OrderSuccessPage"));
const AccountPage = lazy(() => import("./components/account/AccountPage"));
const LoginPage = lazy(() => import("./components/account/LoginPage"));
const FranchisePage = lazy(() => import("./components/franchise/FranchisePage"));
const FranchiseApplication = lazy(() => import("./components/franchise/FranchiseApplication"));
const FranchiseStatusPage = lazy(() => import("./components/franchise/FranchiseStatusPage"));
const SocialHubPage = lazy(() => import("./components/social/SocialHubPage"));
const D2CStreetPage = lazy(() => import("./components/social/D2CStreetPage"));
const DeliveryLocationPage = lazy(() => import("./delivery/DeliveryLocationPage"));
const DealsPage = lazy(() => import("./components/discovery/DealsPage"));
const NewArrivalsPage = lazy(() => import("./components/discovery/NewArrivalsPage"));
const TrendingPage = lazy(() => import("./components/discovery/TrendingPage"));
const BrandsPage = lazy(() => import("./components/discovery/BrandsPage"));
const PulsePage = lazy(() => import("./components/discovery/PulsePage"));
const NotFoundPage = lazy(() => import("./components/layout/NotFoundPage"));
const AdminApp = lazy(() => import("./components/admin/AdminApp"));
const AdminLoginPage = lazy(() => import("./components/admin/AdminLoginPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RequireAuth({ children }) {
  const user = useCurrentUser();
  const location = useLocation();
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

function Loading() {
  return (
    <div className="route-fallback">
      <span className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );
}

function Storefront() {
  useLiveSync();
  return (
    <>
      <MainHeader />
      <main className="app-main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/category/:category" element={<CategoryLandingPage />} />
            <Route path="/product/:productId" element={<ProductDetailsPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="/order-success/:orderId" element={<RequireAuth><OrderSuccessPage /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
            <Route path="/orders/:orderId" element={<RequireAuth><OrderDetailsPage /></RequireAuth>} />
            <Route path="/tracking/:shipmentId?" element={<ShipmentTrackingPage />} />
            <Route path="/returns" element={<RequireAuth><ReturnsPage /></RequireAuth>} />
            <Route path="/account/:section?" element={<RequireAuth><AccountPage /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/franchise" element={<FranchisePage />} />
            <Route path="/franchise/apply" element={<FranchiseApplication />} />
            <Route path="/franchise/status" element={<FranchiseStatusPage />} />
            <Route path="/social" element={<SocialHubPage />} />
            <Route path="/d2c-street" element={<D2CStreetPage />} />
            <Route path="/delivery-location" element={<DeliveryLocationPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/new-arrivals" element={<NewArrivalsPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/brands/:brandId?" element={<BrandsPage />} />
            <Route path="/pulse" element={<PulsePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <SiteFooter />
      <MobileTabBar />
      <CartDrawer />
      <ProductQuickView />
      <PincodeModal />
      <SandboxGateway />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <ScrollToTop />
        <Routes>
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<Loading />}>
                <AdminLoginPage />
              </Suspense>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<Loading />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="/*" element={<Storefront />} />
        </Routes>
        <Toaster />
      </ShopProvider>
    </BrowserRouter>
  );
}
