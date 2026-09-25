import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ShopProvider, useShop } from "./context/ShopContext";

import MainHeader from "./components/layout/MainHeader";

import HomePage from "./components/home/HomePage";
import ShopPage from "./components/shop/ShopPage";
import SearchResultsPage from "./components/search/SearchResultsPage";
import CategoryLandingPage from "./components/category/CategoryLandingPage";

import ProductDetailsPage from "./components/product/ProductDetailsPage";

import WishlistPage from "./components/wishlist/WishlistPage";
import CartDrawer from "./components/cart/CartDrawer";

import CheckoutPage from "./components/checkout/CheckoutPage";

import OrdersPage from "./components/order/OrdersPage";
import OrderDetailsPage from "./components/order/OrderDetailsPage";
import ShipmentTrackingPage from "./components/order/ShipmentTrackingPage";
import ReturnsPage from "./components/order/ReturnsPage";
import OrderSuccessPage from "./components/order/OrderSuccessPage";

import AccountPage from "./components/account/AccountPage";

import FranchisePage from "./components/franchise/FranchisePage";
import FranchiseApplication from "./components/franchise/FranchiseApplication";
import AdminFranchisePage from "./components/franchise/AdminFranchisePage";

import SocialHubPage from "./components/social/SocialHubPage";
import D2CStreetPage from "./components/social/D2CStreetPage";

import DeliveryLocationPage from "./delivery/DeliveryLocationPage";

import DealsPage from "./components/discovery/DealsPage";
import NewArrivalsPage from "./components/discovery/NewArrivalsPage";
import TrendingPage from "./components/discovery/TrendingPage";
import BrandsPage from "./components/discovery/BrandsPage";

import AdminLoginPage from "./components/admin/AdminLoginPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminOrdersPage from "./components/admin/AdminOrdersPage";
import AdminShipmentsPage from "./components/admin/AdminShipmentsPage";
import AdminCustomersPage from "./components/admin/AdminCustomersPage";
import AdminReturnsPage from "./components/admin/AdminReturnsPage";
import AdminInventoryPage from "./components/admin/AdminInventoryPage";
import AdminWarehousesPage from "./components/admin/AdminWarehousesPage";

import "./App.css";

function CartOverlay() {
  const { isCartOpen, closeCart } = useShop();

  if (!isCartOpen) {
    return null;
  }

  return <CartDrawer onClose={closeCart} />;
}

function AppShell() {
  const {
    cartCount,
    wishlistCount
  } = useShop();

  return (
    <>
      <MainHeader
        cartCount={cartCount}
        wishlistCount={wishlistCount}
      />

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/shop" element={<ShopPage />} />

        <Route
          path="/search"
          element={<SearchResultsPage />}
        />

        <Route
          path="/category/:category"
          element={<CategoryLandingPage />}
        />

        <Route
          path="/product/:productId"
          element={<ProductDetailsPage />}
        />

        <Route
          path="/wishlist"
          element={<WishlistPage />}
        />

        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />

        <Route
          path="/orders"
          element={<OrdersPage />}
        />

        <Route
          path="/orders/:orderId"
          element={<OrderDetailsPage />}
        />

        <Route
          path="/tracking/:shipmentId"
          element={<ShipmentTrackingPage />}
        />

        <Route
          path="/returns"
          element={<ReturnsPage />}
        />

        <Route
          path="/order-success"
          element={<OrderSuccessPage />}
        />

        <Route
          path="/account"
          element={<AccountPage />}
        />

        <Route
          path="/franchise"
          element={<FranchisePage />}
        />

        <Route
          path="/franchise/apply"
          element={<FranchiseApplication />}
        />

        <Route
          path="/social"
          element={<SocialHubPage />}
        />

        <Route
          path="/d2c-street"
          element={<D2CStreetPage />}
        />

        <Route
          path="/delivery-location"
          element={<DeliveryLocationPage />}
        />

        <Route
          path="/deals"
          element={<DealsPage />}
        />

        <Route
          path="/new-arrivals"
          element={<NewArrivalsPage />}
        />

        <Route
          path="/trending"
          element={<TrendingPage />}
        />

        <Route
          path="/brands"
          element={<BrandsPage />}
        />

        <Route
          path="/admin/login"
          element={<AdminLoginPage />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/orders"
          element={<AdminOrdersPage />}
        />

        <Route
          path="/admin/shipments"
          element={<AdminShipmentsPage />}
        />

        <Route
          path="/admin/customers"
          element={<AdminCustomersPage />}
        />

        <Route
          path="/admin/inventory"
          element={<AdminInventoryPage />}
        />

        <Route
          path="/admin/warehouses"
          element={<AdminWarehousesPage />}
        />

        <Route
          path="/admin/returns"
          element={<AdminReturnsPage />}
        />

        <Route
          path="/admin/franchise"
          element={<AdminFranchisePage />}
        />

        <Route
          path="*"
          element={<HomePage />}
        />
      </Routes>

      <CartOverlay />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <AppShell />
      </ShopProvider>
    </BrowserRouter>
  );
}