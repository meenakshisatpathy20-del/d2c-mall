/*
 * Safe wrapper for WebGL scenes: lazy-loads three.js, checks WebGL support
 * and catches any render error so the rest of the page can never go blank.
 */
import { Component, Suspense, lazy, useMemo } from "react";
import { Img } from "./ui";

const Discovery = lazy(() => import("../home/D2CDiscovery3D"));
const Globe = lazy(() => import("../three/PulseGlobe"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.warn("[3D] scene disabled:", err?.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Collage({ products = [] }) {
  return (
    <div className="d3-fallback">
      {products.slice(0, 6).map((p) => (
        <Img key={p.id} src={p.images[0]} alt={p.name} label={p.brand} />
      ))}
    </div>
  );
}

export function DiscoveryScene(props) {
  const ok = useMemo(hasWebGL, []);
  const fallback = <Collage products={props.products} />;
  if (!ok) return fallback;
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={<div className="d3-wrap" />}>
        <Discovery {...props} />
      </Suspense>
    </Boundary>
  );
}

export function GlobeScene(props) {
  const ok = useMemo(hasWebGL, []);
  const fallback = <div className="globe-fallback" />;
  if (!ok) return fallback;
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={<div className="globe-fallback" />}>
        <Globe {...props} />
      </Suspense>
    </Boundary>
  );
}
