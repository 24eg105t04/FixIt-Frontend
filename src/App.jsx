
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CustomerDashboard from "./pages/CustomerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import NearbyShops from "./NearbyShops";
import YouFix from "./pages/YouFix";
import ShopProfile from "./pages/ShopProfile";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div className="route-loading" role="status">Checking your FixIt session…</div>;

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Navigate
      to={
        user.role === "seller"
          ? "/seller-dashboard"
          : "/customer-dashboard"
      }
      replace
    />
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="route-loading" role="status">Checking your FixIt session…</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={
          user.role === "seller"
            ? "/seller-dashboard"
            : "/customer-dashboard"
        }
        replace
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/shops/:sellerId" element={<ShopProfile />} />

      <Route
        path="/customer-dashboard"
        element={
          <ProtectedRoute role="customer">
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller-dashboard"
        element={
          <ProtectedRoute role="seller">
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
  path="/youfix"
  element={
    <ProtectedRoute role="customer">
      <YouFix />
    </ProtectedRoute>
  }
/>
      <Route
  path="/nearby-shops"
  element={
    <ProtectedRoute role="customer">
      <NearbyShops />
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="fixit-app">
          <div className="fixit-content">
            <AppRoutes />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
