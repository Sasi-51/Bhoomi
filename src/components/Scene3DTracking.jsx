import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, Line } from '@react-three/drei';
import * as THREE from 'three';

const STOP_COLOR = { hub: '#0F6E56', stop: '#8A5E17', destination: '#185FA5' };

function projectRoute(route) {
  const lats = route.map((p) => p.lat);
  const lngs = route.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  const scale = 6;

  return route.map((p, i) => ({
    ...p,
    role: i === 0 ? 'hub' : i === route.length - 1 ? 'destination' : 'stop',
    x: ((p.lng - minLng) / spanLng - 0.5) * scale,
    z: -((p.lat - minLat) / spanLat - 0.5) * scale
  }));
}

function StopMarker({ position, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const bob = Math.sin(clock.getElapsedTime() * 2 + position[0]) * 0.05;
    ref.current.position.y = 0.22 + bob;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.14, 0.19, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      <mesh ref={ref}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function MovingShipment({ curve, progress }) {
  const ref = useRef();
  const trailRefs = [useRef(), useRef(), useRef()];

  useFrame(({ clock }) => {
    const t = Math.min(1, Math.max(0, progress));
    const pos = curve.getPointAt(t);
    const bob = Math.sin(clock.getElapsedTime() * 3) * 0.04;
    ref.current.position.set(pos.x, pos.y + 0.22 + bob, pos.z);

    trailRefs.forEach((r, i) => {
      const trailT = Math.max(0, t - (i + 1) * 0.025);
      const tPos = curve.getPointAt(trailT);
      r.current.position.set(tPos.x, tPos.y + 0.22, tPos.z);
    });
  });

  return (
    <group>
      <mesh ref={ref}>
        <icosahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color="#E2A33B" emissive="#E2A33B" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
      {trailRefs.map((r, i) => (
        <mesh key={i} ref={r}>
          <sphereGeometry args={[0.07 - i * 0.015, 8, 8]} />
          <meshBasicMaterial color="#E2A33B" transparent opacity={0.35 - i * 0.1} />
        </mesh>
      ))}
    </group>
  );
}

function TrackingScene({ route, progress }) {
  const projected = useMemo(() => projectRoute(route), [route]);

  const curve = useMemo(() => {
    const points = projected.map((p) => new THREE.Vector3(p.x, 0.02, p.z));
    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.15);
  }, [projected]);

  const linePoints = useMemo(() => curve.getPoints(60), [curve]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1} color="#FFF6E5" />
      <Grid
        args={[10, 10]}
        cellColor="#D8DCCD"
        sectionColor="#B8C7A8"
        fadeDistance={12}
        infiniteGrid
        position={[0, 0, 0]}
      />
      <Line points={linePoints} color="#3D5E71" lineWidth={2} />
      {projected.map((p) => (
        <StopMarker key={p.label} position={[p.x, 0, p.z]} color={STOP_COLOR[p.role]} />
      ))}
      <MovingShipment curve={curve} progress={progress} />
    </>
  );
}

export default function Scene3DTracking({ route, progress }) {
  if (!route || route.length < 2) return null;
  return (
    <Canvas camera={{ position: [0, 4.5, 5.5], fov: 42 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
      <TrackingScene route={route} progress={progress} />
    </Canvas>
  );
}
