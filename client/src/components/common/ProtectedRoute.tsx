import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Permission } from "../../types";
import EmptyState from "./EmptyState";
import Spinner from "./Spinner";

export default function ProtectedRoute({ permission }: { permission?: Permission }) {
  const { user, initializing, can } = useAuth();
  const location = useLocation();

  if (initializing) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />;
  if (permission && !can(permission)) {
    return <EmptyState title="Bu bölməyə giriş icazəniz yoxdur." />;
  }
  return <Outlet />;
}
