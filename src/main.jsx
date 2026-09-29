import { Component, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

/** Last-resort guard so an unexpected error never leaves a blank white page. */
class RootBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("[D2C Mall] Unhandled UI error", error, info?.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#07132f", color: "#fff", textAlign: "center" }}>
        <div style={{ maxWidth: 440 }}>
          <h1 style={{ color: "#fff", fontSize: 28 }}>Something went wrong</h1>
          <p style={{ color: "#cbd5ea", marginTop: 8 }}>We hit an unexpected error. Your bag and orders are safe — please reload the page.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20 }}>
            <button className="btn" onClick={() => window.location.reload()}>Reload</button>
            <button
              className="btn btn-glass"
              onClick={() => {
                try {
                  localStorage.removeItem("d2c_mall_state_v3");
                } catch {
                  /* ignore */
                }
                window.location.href = "/";
              }}
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RootBoundary>
      <App />
    </RootBoundary>
  </StrictMode>
);
