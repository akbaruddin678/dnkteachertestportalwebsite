import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  // Not logged in
  if (!user) return <Navigate to="/" replace />;

  // Role not allowed
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // All good
  return <Outlet />;
};

export default ProtectedRoute;
