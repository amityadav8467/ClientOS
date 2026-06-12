import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ForceChangePassword from "../ui/ForceChangePassword";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-bg-border border-t-teal-400 rounded-full animate-spin" />
          <p className="font-dm text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) {
    return <Navigate to={user.role === "admin" ? "/dashboard" : "/portal"} replace />;
  }

  // Show force-change-password overlay for first-time client logins
  // Also show for admin if somehow isFirstLogin is true
  if (user.isFirstLogin) {
    return (
      <>
        {children}
        <ForceChangePassword />
      </>
    );
  }

  return children;
}
