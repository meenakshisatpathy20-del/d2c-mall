import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, OrbitControls } from "@react-three/drei";
import { useRef } from "react";
import "./D2CDiscovery3D.css";

function FloatingShape({ position, scale, color, speed }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed;
    ref.current.rotation.y += delta * speed * 0.8;
  });

  return (
    <Float
      speed={1.2}
      rotationIntensity={0.35}
      floatIntensity={0.7}
      floatingRange={[-0.15, 0.15]}
    >
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.28}
          metalness={0.25}
        />
      </mesh>
    </Float>
  );
}

function ShoppingOrb() {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.35;
  });

  return (
    <Float
      speed={1}
      rotationIntensity={0.25}
      floatIntensity={0.5}
    >
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[1.55, 64, 64]} />
          <meshStandardMaterial
            color="#ff6b00"
            roughness={0.2}
            metalness={0.35}
          />
        </mesh>

        <mesh scale={1.12}>
          <sphereGeometry args={[1.55, 48, 48]} />
          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.12}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1.5} />

      <directionalLight
        position={[4, 5, 6]}
        intensity={3}
      />

      <pointLight
        position={[-4, 2, 3]}
        intensity={12}
        distance={10}
      />

      <ShoppingOrb />

      <FloatingShape
        position={[-2.8, 1.25, -0.5]}
        scale={0.52}
        color="#175cd3"
        speed={0.45}
      />

      <FloatingShape
        position={[2.9, 1.45, -0.7]}
        scale={0.42}
        color="#12b76a"
        speed={0.6}
      />

      <FloatingShape
        position={[-2.6, -1.3, 0]}
        scale={0.32}
        color="#f79009"
        speed={0.8}
      />

      <FloatingShape
        position={[2.6, -1.4, -0.3]}
        scale={0.48}
        color="#7f56d9"
        speed={0.5}
      />

      <Environment preset="city" />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 2.6}
        maxPolarAngle={Math.PI / 1.8}
      />
    </>
  );
}

export default function D2CDiscovery3D({
  onExplore = () => {}
}) {
  return (
    <section className="d2c-discovery-3d">
      <div className="d2c-discovery-copy">
        <span>THE D2C PULSE</span>

        <h2>
          See what's
          <br />
          <strong>moving.</strong>
        </h2>

        <p>
          Discover what people are wearing, buying, saving and
          sharing right now.
        </p>

        <div className="d2c-discovery-actions">
          <button onClick={onExplore}>
            Explore D2C Street
          </button>

          <div className="d2c-discovery-stats">
            <div>
              <strong>12K+</strong>
              <span>Looks</span>
            </div>

            <div>
              <strong>4.8★</strong>
              <span>Community</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Fresh drops</span>
            </div>
          </div>
        </div>
      </div>

      <div className="d2c-discovery-canvas">
        <Canvas
          camera={{
            position: [0, 0, 7],
            fov: 42
          }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true
          }}
        >
          <Scene />
        </Canvas>

        <div className="d2c-canvas-label d2c-label-one">
          TRENDING NOW
        </div>

        <div className="d2c-canvas-label d2c-label-two">
          SHOP THE LOOK
        </div>

        <div className="d2c-canvas-label d2c-label-three">
          NEW DROP
        </div>
      </div>
    </section>
  );
}