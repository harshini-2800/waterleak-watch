import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

function LiquidDroplet({ mousePosition }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    // Smooth idle breathing and rotation
    meshRef.current.rotation.x = Math.sin(time * 0.4) * 0.2 + mousePosition.y * 0.3;
    meshRef.current.rotation.y = time * 0.25 + mousePosition.x * 0.3;
  });

  return (
    <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <Sphere ref={meshRef} args={[1.5, 64, 64]} scale={1.2}>
        <MeshDistortMaterial
          color="#22D3EE"
          attach="material"
          distort={0.42}
          speed={2.2}
          roughness={0.08}
          metalness={0.3}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transmission={0.65}
          ior={1.33} // Water refractive index!
          thickness={1.5}
        />
      </Sphere>
    </Float>
  );
}

function FloatingParticles({ count = 40 }) {
  const points = useRef();

  const particles = React.useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 10;
      coords[i * 3 + 1] = (Math.random() - 0.5) * 8;
      coords[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return coords;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#38BDF8"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function RippleRings() {
  const ringRef = useRef();

  useFrame((state) => {
    if (!ringRef.current) return;
    const t = (state.clock.getElapsedTime() * 0.5) % 2;
    ringRef.current.scale.set(1 + t * 1.5, 1 + t * 1.5, 1);
    ringRef.current.material.opacity = Math.max(0, 0.4 - t * 0.2);
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1.8, 0]}>
      <ringGeometry args={[1.6, 1.7, 64]} />
      <meshBasicMaterial color="#22D3EE" transparent opacity={0.3} side={THREE.DoubleSide} />
    </mesh>
  );
}

export default function WaterHeroCanvas() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hasWebGL, setHasWebGL] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setHasWebGL(false);
    } catch {
      setHasWebGL(false);
    }

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fallback for devices without WebGL or with reduced motion
  if (!hasWebGL || prefersReducedMotion) {
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-ocean-dark via-primary-aqua to-tealAccent opacity-80 blur-2xl animate-pulse" />
        <img
          src="/water-drop.svg"
          alt="Water Droplet"
          className="w-36 h-36 md:w-52 md:h-52 relative z-10 drop-shadow-[0_0_35px_rgba(34,211,238,0.5)] animate-float"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]} // Capped pixel ratio for high mobile performance
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#E0F2FE" />
        <pointLight position={[-10, -5, -5]} intensity={0.8} color="#06B6D4" />
        <LiquidDroplet mousePosition={mousePos} />
        <RippleRings />
        <FloatingParticles count={35} />
      </Canvas>
    </div>
  );
}

