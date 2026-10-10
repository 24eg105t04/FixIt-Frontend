
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CustomerDashboard from "./pages/CustomerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import WorkbenchBackground from "./components/WorkbenchBackground";
import NearbyShops from "./NearbyShops";

function HomeRedirect() {
  const { user } = useAuth();

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
  const { user } = useAuth();

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
          <WorkbenchBackground />
          <div className="fixit-content">
            <AppRoutes />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
