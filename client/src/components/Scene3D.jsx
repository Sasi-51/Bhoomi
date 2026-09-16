import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Line } from '@react-three/drei';
import * as THREE from 'three';

const AGENT_COLORS = ['#E2A33B', '#3D5E71', '#C96A4B', '#4F8F6A', '#993C1D'];

function AgentNode({ radius, speed, offset, color, size }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 1.3) * 0.35;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} emissive={color} emissiveIntensity={0.25} />
    </mesh>
  );
}

function OrbitRing({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return pts;
  }, [radius]);
  return <Line points={points} color="#3D5E71" opacity={0.18} transparent lineWidth={1} />;
}

function Core() {
  const coreRef = useRef();
  useFrame((_, delta) => {
    coreRef.current.rotation.y += delta * 0.18;
    coreRef.current.rotation.x += delta * 0.05;
  });
  return (
    <mesh ref={coreRef}>
      <icosahedronGeometry args={[1.15, 1]} />
      <meshStandardMaterial color="#16302A" wireframe roughness={0.5} />
    </mesh>
  );
}

function Rig() {
  const group = useRef();
  useFrame(({ clock, mouse }) => {
    group.current.rotation.y = clock.getElapsedTime() * 0.05 + mouse.x * 0.15;
    group.current.rotation.x = mouse.y * 0.08;
  });

  return (
    <group ref={group}>
      <Core />
      <OrbitRing radius={2.1} />
      {AGENT_COLORS.map((color, i) => (
        <AgentNode
          key={color}
          radius={2.1}
          speed={0.35 + i * 0.05}
          offset={(i / AGENT_COLORS.length) * Math.PI * 2}
          color={color}
          size={0.22}
        />
      ))}
    </group>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, 1.4, 5.4], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 5, 3]} intensity={1.1} color="#FFF6E5" />
      <directionalLight position={[-4, -2, -3]} intensity={0.3} color="#3D5E71" />
      <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.6}>
        <Rig />
      </Float>
      <Sparkles count={60} scale={[7, 4, 7]} size={2.2} speed={0.25} color="#E2A33B" opacity={0.5} />
    </Canvas>
  );
}
