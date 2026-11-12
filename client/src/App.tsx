import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RouteEffects from "./components/common/RouteEffects";
import Layout from "./components/layout/Layout";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import ProductForm from "./pages/admin/ProductForm";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Compare from "./pages/Compare";
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
import Wishlist from "./pages/Wishlist";

export default function App() {
  return (
    <>
      <RouteEffects />
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
    </>
  );
}
