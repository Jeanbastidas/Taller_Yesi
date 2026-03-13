import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Cylinder,
  Sphere,
  Box,
  Text,
  Line,
} from "@react-three/drei";
import * as THREE from "three";

// ── Stokes 3D Scene ──────────────────────────────────────────────────────────
interface StokesSceneProps {
  progress: number; // 0-100
  radius: number; // particle radius in metres
  fluidColor: string;
  particleColor: string;
  isRunning: boolean;
}

const FluidParticles = ({ fluidColor }: { fluidColor: string }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, () => ({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 1.8,
          (Math.random() - 0.5) * 0.4,
        ),
        speed: 0.001 + Math.random() * 0.002,
        phase: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      child.position.y =
        p.pos.y + Math.sin(clock.elapsedTime * p.speed * 60 + p.phase) * 0.05;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color={fluidColor} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
};

const StokesScene = ({
  progress,
  radius,
  fluidColor,
  particleColor,
  isRunning,
}: StokesSceneProps) => {
  const sphereRef = useRef<THREE.Mesh>(null!);
  const wakeRef = useRef<THREE.Mesh>(null!);

  const cylinderHeight = 2;
  const particleY = cylinderHeight / 2 - (progress / 100) * cylinderHeight;
  const displayRadius = Math.min(Math.max(radius * 800, 0.03), 0.18);

  useFrame(() => {
    if (!sphereRef.current) return;
    sphereRef.current.position.y = particleY;
    if (wakeRef.current) {
      wakeRef.current.position.y = particleY + displayRadius + 0.05;
      (wakeRef.current.material as THREE.MeshStandardMaterial).opacity =
        isRunning ? 0.15 : 0;
    }
  });

  return (
    <>
      {/* Cylinder (outer glass) */}
      <Cylinder
        args={[0.3, 0.3, cylinderHeight, 32, 1, true]}
        position={[0, 0, 0]}
      >
        <meshPhysicalMaterial
          color="#88ccff"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </Cylinder>
      {/* Cylinder walls */}
      <Cylinder
        args={[0.3, 0.3, cylinderHeight, 32, 1, true]}
        position={[0, 0, 0]}
      >
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.08}
          wireframe={true}
        />
      </Cylinder>

      {/* Fluid fill */}
      <Cylinder args={[0.295, 0.295, cylinderHeight, 32]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color={fluidColor}
          transparent
          opacity={0.24}
          roughness={0.08}
          metalness={0.06}
        />
      </Cylinder>

      {/* Fluid Particles */}
      <FluidParticles fluidColor={fluidColor} />

      {/* Wake cone */}
      <mesh ref={wakeRef} position={[0, particleY, 0]}>
        <coneGeometry
          args={[displayRadius * 1.5, displayRadius * 4, 16, 1, true]}
        />
        <meshStandardMaterial
          color={fluidColor}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Falling sphere */}
      <Sphere
        ref={sphereRef}
        args={[displayRadius, 32, 32]}
        position={[0, particleY, 0]}
      >
        <meshPhysicalMaterial
          color={particleColor}
          roughness={0.1}
          metalness={0.8}
          envMapIntensity={1}
        />
      </Sphere>

      {/* Depth markers */}
      {[0, 0.25, 0.5, 0.75, 1].map((m) => (
        <group
          key={m}
          position={[0.32, cylinderHeight / 2 - m * cylinderHeight, 0]}
        >
          <mesh>
            <boxGeometry args={[0.04, 0.005, 0.005]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      ))}
    </>
  );
};

// ── Couette 3D Scene ─────────────────────────────────────────────────────────
interface CouetteSceneProps {
  uTop: number;
  h: number;
  fluidColor: string;
}

const CouetteScene = ({ uTop, h, fluidColor }: CouetteSceneProps) => {
  const topPlateRef = useRef<THREE.Mesh>(null!);
  const arrowsRef = useRef<THREE.Group>(null!);
  const plateW = 1.2;
  const plateD = 0.6;
  const sceneH = 1.2;

  useFrame(({ clock }) => {
    if (!topPlateRef.current) return;
    const t = clock.elapsedTime;
    topPlateRef.current.position.x = Math.sin(t * uTop) * 0.08;
  });

  const vectors = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const frac = i / 7;
      const speed = uTop * frac;
      return { y: -sceneH / 2 + frac * sceneH, len: speed };
    });
  }, [uTop, sceneH]);

  return (
    <>
      {/* Bottom plate (fixed) */}
      <Box args={[plateW, 0.04, plateD]} position={[0, -sceneH / 2, 0]}>
        <meshStandardMaterial
          color="#1f2937"
          roughness={0.35}
          metalness={0.6}
        />
      </Box>

      {/* Top plate (moving) */}
      <Box
        ref={topPlateRef}
        args={[plateW, 0.04, plateD]}
        position={[0, sceneH / 2, 0]}
      >
        <meshStandardMaterial
          color={fluidColor}
          roughness={0.2}
          metalness={0.5}
          emissive={fluidColor}
          emissiveIntensity={0.2}
        />
      </Box>

      {/* Fluid body */}
      <Box args={[plateW, sceneH, plateD]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color={fluidColor}
          transparent
          opacity={0.18}
          roughness={0.2}
        />
      </Box>

      {/* Velocity vectors */}
      <group ref={arrowsRef}>
        {vectors.map((v, i) => (
          <group key={i} position={[-plateW / 2, v.y, 0]}>
            <mesh position={[v.len * 0.3, 0, 0]}>
              <boxGeometry args={[v.len * 0.6, 0.015, 0.015]} />
              <meshStandardMaterial
                color={fluidColor}
                emissive={fluidColor}
                emissiveIntensity={0.4}
              />
            </mesh>
            {v.len > 0.05 && (
              <mesh
                position={[v.len * 0.62, 0, 0]}
                rotation={[0, 0, -Math.PI / 2]}
              >
                <coneGeometry args={[0.025, 0.06, 8]} />
                <meshStandardMaterial
                  color={fluidColor}
                  emissive={fluidColor}
                  emissiveIntensity={0.5}
                />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </>
  );
};

// ── Main Exported Component ───────────────────────────────────────────────────
interface Lab3DContainerProps {
  mode: "stokes" | "couette";
  stokesProps?: StokesSceneProps;
  couetteProps?: CouetteSceneProps;
  className?: string;
}

export const Lab3DContainer = ({
  mode,
  stokesProps,
  couetteProps,
  className = "",
}: Lab3DContainerProps) => {
  const cameraConfig = useMemo(() => {
    if (mode === "stokes") {
      return {
        position: [1.35, 0.65, 1.65] as [number, number, number],
        target: [0, 0.05, 0] as [number, number, number],
        fov: 46,
        minDistance: 0.9,
        maxDistance: 3.2,
      };
    }
    return {
      position: [1.6, 0.6, 2.1] as [number, number, number],
      target: [0, 0, 0] as [number, number, number],
      fov: 48,
      minDistance: 1.2,
      maxDistance: 4.2,
    };
  }, [mode]);

  return (
    <div
      className={`w-full h-full rounded-2xl overflow-hidden relative ${className}`}
      style={{ minHeight: "320px" }}
    >
      <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-black/50 backdrop-blur text-[9px] font-bold text-brand-accent uppercase tracking-widest border border-brand-accent/20">
        3D • WebGL
      </div>
      <Canvas
        shadows
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.35} />
        <hemisphereLight
          intensity={0.4}
          color="#ffffff"
          groundColor="#0b1020"
        />
        <directionalLight position={[5, 10, 5]} intensity={1.1} castShadow />
        <pointLight position={[-3, 3, -3]} intensity={0.6} color="#60a5fa" />

        {mode === "stokes" && stokesProps && <StokesScene {...stokesProps} />}
        {mode === "couette" && couetteProps && (
          <CouetteScene {...couetteProps} />
        )}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.08}
          target={cameraConfig.target}
          minDistance={cameraConfig.minDistance}
          maxDistance={cameraConfig.maxDistance}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
        />
      </Canvas>
      <div className="absolute bottom-3 right-3 text-[8px] text-slate-500 font-mono pointer-events-none">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
};
