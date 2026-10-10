
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Wrench,
  Eye,
  EyeOff,
  ArrowRight,
  UserRound,
  Store,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import "../styles/auth.css";

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password || !confirmPassword) {
      setError("Please fill in all the fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = register({
        name: cleanName,
        email: cleanEmail,
        password,
        role,
      });

      if (!result.success) {
        setError(result.message || "Registration failed. Please try again.");
        return;
      }

      // Registration succeeds; open the dashboard for the selected role.
      navigate(
        result.user.role === "seller"
          ? "/seller-dashboard"
          : "/customer-dashboard",
        { replace: true }
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-intro">
        <Link to="/login" className="auth-brand">
          <span className="auth-brand-icon">
            <Wrench size={22} />
          </span>
          <span>FixIt</span>
        </Link>

        <div className="auth-intro-content">
          <span className="auth-eyebrow">A smarter way to repair</span>

          <h1>
            Give your devices
            <br />
            a <span>second life.</span>
          </h1>

          <p>
            Find trusted repair shops, compare quotes, discover quality parts,
            and get help from FixIt AI — all in one place.
          </p>

          <div className="auth-benefits">
            <div>
              <CheckCircle2 size={19} />
              <span>Compare repair prices</span>
            </div>
            <div>
              <CheckCircle2 size={19} />
              <span>Connect with local experts</span>
            </div>
            <div>
              <CheckCircle2 size={19} />
              <span>Shop parts and accessories</span>
            </div>
          </div>
        </div>

        <p className="auth-footer-note">
          Repair smarter. Waste less. Keep things working.
        </p>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-brand-icon">
              <Wrench size={20} />
            </span>
            <span>FixIt</span>
          </div>

          <div className="auth-heading">
            <span className="auth-eyebrow">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Join FixIt as a customer or a repair shop owner.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-role-label">I want to join as a</div>

            <div className="auth-role-selector">
              <button
                type="button"
                className={`auth-role-option ${
                  role === "customer" ? "active" : ""
                }`}
                onClick={() => setRole("customer")}
                aria-pressed={role === "customer"}
              >
                <UserRound size={20} />
                <span>
                  <strong>Customer</strong>
                  <small>Repair and shop</small>
                </span>
              </button>

              <button
                type="button"
                className={`auth-role-option ${
                  role === "seller" ? "active" : ""
                }`}
                onClick={() => setRole("seller")}
                aria-pressed={role === "seller"}
              >
                <Store size={20} />
                <span>
                  <strong>Shop owner</strong>
                  <small>Manage repairs</small>
                </span>
              </button>
            </div>

            <label className="auth-label" htmlFor="signup-name">
              Full name
            </label>
            <input
              id="signup-name"
              className="auth-input"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

            <label className="auth-label" htmlFor="signup-email">
              Email address
            </label>
            <input
              id="signup-email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label className="auth-label" htmlFor="signup-password">
              Password
            </label>
            <div className="auth-password-wrap">
              <input
                id="signup-password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <label className="auth-label" htmlFor="signup-confirm-password">
              Confirm password
            </label>
            <div className="auth-password-wrap">
              <input
                id="signup-confirm-password"
                className="auth-input"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter your password again"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="auth-security-note">
              <ShieldCheck size={17} />
              <span>Your account details stay in your browser demo.</span>
            </div>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>

          <p className="auth-terms">
            By creating an account, you agree to use FixIt responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}
