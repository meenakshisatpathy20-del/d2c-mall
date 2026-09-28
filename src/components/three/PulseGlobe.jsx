/*
 * Live India fulfilment map (WebGL): warehouses as glowing towers, cities as
 * pins and animated arcs carrying live orders from hub → city.
 */
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { warehouses } from "../../data/logistics";

const CITIES = [
  ["Mumbai", 19.07, 72.88], ["Delhi", 28.61, 77.21], ["Bengaluru", 12.97, 77.59], ["Chennai", 13.08, 80.27],
  ["Kolkata", 22.57, 88.36], ["Hyderabad", 17.39, 78.49], ["Pune", 18.52, 73.85], ["Ahmedabad", 23.02, 72.57],
  ["Lucknow", 26.85, 80.95], ["Jamshedpur", 22.8, 86.2], ["Guwahati", 26.14, 91.74], ["Kochi", 9.93, 76.27],
  ["Chandigarh", 30.73, 76.78], ["Bhopal", 23.26, 77.41], ["Patna", 25.59, 85.14], ["Bhubaneswar", 20.3, 85.82],
];

const toXZ = (lat, lng) => new THREE.Vector3((lng - 81) * 0.32, 0, -(lat - 21.5) * 0.34);

function Arc({ from, to, color, speed, offset }) {
  const pulse = useRef();
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    mid.y = 0.6 + from.distanceTo(to) * 0.22;
    return new THREE.QuadraticBezierCurve3(from.clone().setY(0.08), mid, to.clone().setY(0.03));
  }, [from, to]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.012, 6, false), [curve]);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * speed + offset) % 1;
    pulse.current?.position.copy(curve.getPoint(t));
  });
  return (
    <>
      <mesh geometry={geo}>
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </>
  );
}

function Tower({ wh, height }) {
  const ref = useRef();
  const pos = toXZ(wh.lat, wh.lng);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2 + height) * 0.15);
  });
  return (
    <group position={pos}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.11, height, 16]} />
        <meshStandardMaterial color={wh.color} emissive={wh.color} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.18, 0.26, 32]} />
        <meshBasicMaterial color={wh.color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene({ intensity }) {
  const group = useRef();
  useFrame((_, d) => {
    if (group.current) group.current.rotation.y += d * 0.04;
  });
  const whPos = warehouses.map((w) => ({ w, p: toXZ(w.lat, w.lng) }));
  const arcs = useMemo(
    () =>
      CITIES.map(([name, lat, lng], i) => {
        const p = toXZ(lat, lng);
        const nearest = [...whPos].sort((a, b) => a.p.distanceTo(p) - b.p.distanceTo(p))[0];
        return { key: name, from: nearest.p, to: p, color: nearest.w.color, speed: 0.18 + (i % 5) * 0.05, offset: i * 0.13 };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return (
    <group ref={group}>
      <gridHelper args={[12, 36, "#223557", "#132755"]} position={[0, -0.01, 0]} />
      {CITIES.map(([name, lat, lng]) => (
        <mesh key={name} position={toXZ(lat, lng).setY(0.03)}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color="#dce5f5" />
        </mesh>
      ))}
      {warehouses.map((w, i) => (
        <Tower key={w.id} wh={w} height={0.6 + intensity[i] * 0.9} />
      ))}
      {arcs.map(({ key, ...a }) => (
        <Arc key={key} {...a} />
      ))}
    </group>
  );
}

export default function PulseGlobe({ intensity = [0.8, 1, 0.5, 0.7] }) {
  return (
    <div className="globe-wrap">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 5.2, 6.4], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.8} />
        <pointLight position={[0, 5, 0]} intensity={30} color="#ffffff" />
        <Scene intensity={intensity} />
        <Sparkles count={70} scale={[10, 3, 10]} size={1.8} speed={0.3} color="#8fb0ff" opacity={0.6} />
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={0.5} maxPolarAngle={1.2} />
      </Canvas>
    </div>
  );
}
