import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RouteEffects from "./components/common/RouteEffects";
import Layout from "./components/layout/Layout";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Compare from "./pages/Compare";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import OrderDetail from "./pages/OrderDetail";
import PaymentMock from "./pages/PaymentMock";
import PaymentResult from "./pages/PaymentResult";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Wishlist from "./pages/Wishlist";
import Spinner from "./components/common/Spinner";

const AdminCategories = lazy(() => import("./pages/admin/AdminCategories"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));

export default function App() {
  return (
    <>
      <RouteEffects />
      <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<ProtectedRoute permission="dashboard:read" />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route element={<ProtectedRoute permission="inventory:write" />}>
              <Route path="inventory" element={<AdminInventory />} />
            </Route>
            <Route element={<ProtectedRoute permission="orders:read" />}>
              <Route path="orders" element={<AdminOrders />} />
            </Route>
            <Route element={<ProtectedRoute permission="categories:write" />}>
              <Route path="categories" element={<AdminCategories />} />
            </Route>
            <Route element={<ProtectedRoute permission="users:read" />}>
              <Route path="users" element={<AdminUsers />} />
            </Route>
            <Route element={<ProtectedRoute permission="reviews:moderate" />}>
              <Route path="reviews" element={<AdminReviews />} />
            </Route>
            <Route element={<ProtectedRoute permission="products:write" />}>
              <Route path="coupons" element={<AdminCoupons />} />
            </Route>
            <Route element={<ProtectedRoute permission="emails:read" />}>
              <Route path="emails" element={<AdminEmails />} />
            </Route>
            <Route element={<ProtectedRoute permission="products:write" />}>
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductForm />} />
            </Route>
          </Route>
        </Route>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:slug" element={<ProductDetail />} />
          <Route path="compare" element={<Compare />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route path="cart" element={<Cart />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="payment/mock" element={<PaymentMock />} />
            <Route path="payment/result" element={<PaymentResult />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </>
  );
}
