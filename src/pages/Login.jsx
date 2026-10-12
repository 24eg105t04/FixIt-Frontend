
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wrench,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({ email: cleanEmail, password });

      if (!result.success) {
        setError(result.message || "Unable to sign in. Please try again.");
        return;
      }

      const destination =
        result.user.role === "seller"
          ? "/seller-dashboard"
          : "/customer-dashboard";

      navigate(location.state?.from || destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
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
          <span className="auth-eyebrow">WELCOME TO FIXIT</span>

          <h1>
            Let's get your
            <br />
            tech back <span>on track.</span>
          </h1>

          <p>
            Repair smarter. Compare offers. Find the right parts.
            Your device-care journey starts here.
          </p>

          <div className="auth-benefits">
            <div>
              <ShieldCheck size={19} />
              <span>Make informed choices</span>
            </div>
            <div>
              <CheckCircle2 size={19} />
              <span>Everything in one place</span>
            </div>
          </div>
        </div>

        <p className="auth-footer-note">
          © 2026 FixIt · Repair. Compare. Restore.
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
            <span className="auth-eyebrow">YOUR FIXIT ACCOUNT</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your dashboard.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-label" htmlFor="login-email">
              Email address
            </label>
            <input
              id="login-email"
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label className="auth-label" htmlFor="login-password">
              Password
            </label>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="auth-security-note">
              <ShieldCheck size={17} />
              <span>Sign in using the account you registered with.</span>
            </div>
          </form>

          <p className="auth-switch">
            New to FixIt? <Link to="/signup">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
