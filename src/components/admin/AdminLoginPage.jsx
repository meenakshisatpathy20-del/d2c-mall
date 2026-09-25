import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { useState } from "react";
import "./AdminLoginPage.css";

export default function AdminLoginPage({
  onLogin,
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const submit = async (event) => {
    event.preventDefault();

    if (!form.email || !form.password) {
      setError(
        "Enter your email and password."
      );
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onLogin?.(form);
    } catch (loginError) {
      setError(
        loginError?.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-visual">
        <div className="admin-login-brand">
          <Store size={20} />
          D2C MALL
        </div>

        <div className="admin-login-visual-copy">
          <span>OPERATIONS COMMAND CENTER</span>

          <h1>
            Run the
            <br />
            <strong>entire mall.</strong>
          </h1>

          <p>
            Orders, inventory, warehouses, shipments,
            customers and franchise operations — all
            connected in one place.
          </p>
        </div>

        <div className="admin-login-stats">
          <div>
            <strong>4</strong>
            <span>WAREHOUSES</span>
          </div>

          <div>
            <strong>24/7</strong>
            <span>ORDER FLOW</span>
          </div>

          <div>
            <strong>1</strong>
            <span>CONNECTED SYSTEM</span>
          </div>
        </div>
      </section>

      <section className="admin-login-panel">
        <motion.div
          className="admin-login-box"
          initial={{
            opacity: 0,
            y: 15,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <div className="admin-login-icon">
            <ShieldCheck size={23} />
          </div>

          <span className="admin-login-label">
            SECURE ACCESS
          </span>

          <h2>
            Welcome back.
          </h2>

          <p>
            Sign in to access D2C Mall operations.
          </p>

          <form onSubmit={submit}>
            <label>
              Email address
              <div className="admin-login-input">
                <User size={15} />

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      email:
                        event.target.value,
                    }))
                  }
                  placeholder="admin@d2cmall.com"
                  autoComplete="email"
                />
              </div>
            </label>

            <label>
              Password
              <div className="admin-login-input">
                <LockKeyhole size={15} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password:
                        event.target.value,
                    }))
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="admin-login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >
              {loading
                ? "Signing in..."
                : "Sign in to operations"}

              {!loading && (
                <ArrowRight size={15} />
              )}
            </button>
          </form>

          <div className="admin-login-security">
            <LockKeyhole size={13} />

            <span>
              Protected admin access. Production
              authentication will be handled by the
              backend.
            </span>
          </div>
        </motion.div>
      </section>
    </main>
  );
}