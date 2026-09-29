/*
 * D2C Discovery Galaxy — interactive WebGL product discovery.
 * Product cards orbit a glowing core; hover to lift, click to open.
 * No remote HDR/env maps (the old build crashed when those failed to load).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import "./D2CDiscovery3D.css";

const loader = new THREE.TextureLoader();
loader.setCrossOrigin("anonymous");

function useSafeTexture(url) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let alive = true;
    if (!url) return undefined;
    loader.load(
      url.replace(/w=\d+/, "w=420"),
      (t) => {
        if (!alive) return;
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        setTex(t);
      },
      undefined,
      () => alive && setTex(null)
    );
    return () => {
      alive = false;
    };
  }, [url]);
  return tex;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 8);
  // map UVs 0..1
  const pos = g.attributes.position;
  const uv = [];
  for (let i = 0; i < pos.count; i += 1) uv.push((pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

const CARD_GEO = roundedRect(0.82, 1.04, 0.09);
const FRAME_GEO = roundedRect(0.9, 1.12, 0.12);

function ProductCard3D({ product, angle, radius, y, onSelect, onHover, accent }) {
  const ref = useRef();
  const tex = useSafeTexture(product.images[0]);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!ref.current) return;
    const target = hovered ? 1.3 : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12);
    // always face the camera for readability
    ref.current.lookAt(state.camera.position.x, ref.current.position.y, state.camera.position.z);
  });

  return (
    <group
      ref={ref}
      position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(product);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(product);
      }}
    >
      <mesh geometry={FRAME_GEO} position={[0, 0, -0.01]}>
        <meshBasicMaterial color={hovered ? "#ff6b00" : accent} transparent opacity={hovered ? 1 : 0.85} />
      </mesh>
      <mesh geometry={CARD_GEO}>
        {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial color="#e9eef8" roughness={0.6} />}
      </mesh>
    </group>
  );
}

function Core() {
  const ref = useRef();
  const ring = useRef();
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += d * 0.3;
    if (ring.current) ring.current.rotation.z += d * 0.4;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.6}>
      <group ref={ref}>
        <mesh>
          <icosahedronGeometry args={[0.85, 4]} />
          <meshStandardMaterial color="#ff6b00" emissive="#ff5a00" emissiveIntensity={0.55} roughness={0.25} metalness={0.3} />
        </mesh>
        <mesh scale={1.18}>
          <icosahedronGeometry args={[0.85, 2]} />
          <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.16} />
        </mesh>
      </group>
      <mesh ref={ring} rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[1.35, 0.025, 16, 120]} />
        <meshBasicMaterial color="#2457ff" />
      </mesh>
    </Float>
  );
}

function Orbit({ products, onSelect, onHover, paused }) {
  const group = useRef();
  const hoverRef = useRef(false);
  useFrame((_, d) => {
    if (!group.current || paused) return;
    group.current.rotation.y += d * (hoverRef.current ? 0.02 : 0.12);
  });
  const accents = ["#2457ff", "#493cff", "#12b76a", "#7f56d9"];
  return (
    <group ref={group}>
      {products.map((p, i) => {
        const ring = i % 2;
        const count = Math.ceil(products.length / 2);
        const idx = Math.floor(i / 2);
        const angle = (idx / count) * Math.PI * 2 + ring * (Math.PI / count);
        return (
          <ProductCard3D
            key={p.id}
            product={p}
            angle={angle}
            radius={ring ? 3.05 : 2.25}
            y={ring ? -0.7 : 0.6}
            accent={accents[i % accents.length]}
            onSelect={onSelect}
            onHover={(prod) => {
              hoverRef.current = !!prod;
              onHover(prod);
            }}
          />
        );
      })}
    </group>
  );
}

function Rig() {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.03;
    camera.position.y += (1.1 + pointer.y * 0.4 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function D2CDiscovery3D({ products = [], onSelect, className = "", interactive = true }) {
  const wrap = useRef(null);
  const [visible, setVisible] = useState(true);
  const [hovered, setHovered] = useState(null);
  const items = useMemo(() => products.slice(0, 12), [products]);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = wrap.current;
    if (!el || !("IntersectionObserver" in window)) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={`d3-wrap ${className}`}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible && !reduced ? "always" : "demand"}
        camera={{ position: [0, 1.3, 8.6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} />
        <pointLight position={[-4, 2, 3]} intensity={30} color="#2457ff" distance={12} />
        <pointLight position={[3, -2, 2]} intensity={20} color="#ff6b00" distance={10} />
        <Core />
        <Orbit products={items} onSelect={onSelect} onHover={setHovered} paused={reduced} />
        <Sparkles count={90} scale={[10, 5, 8]} size={2.2} speed={0.35} color="#ffb37a" opacity={0.7} />
        <Sparkles count={60} scale={[10, 5, 8]} size={1.6} speed={0.25} color="#8fb0ff" opacity={0.6} />
        {interactive ? <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 1.8} /> : <Rig />}
      </Canvas>
      <div className={`d3-caption ${hovered ? "show" : ""}`}>
        {hovered ? (
          <>
            <b>{hovered.brand}</b>
            <span>{hovered.name}</span>
            <em>₹{hovered.price.toLocaleString("en-IN")} · tap to view</em>
          </>
        ) : null}
      </div>
    </div>
  );
}
