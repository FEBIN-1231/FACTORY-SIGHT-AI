import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { canRender3D } from '../../utils/webgl';

// Low-poly Gear for Machines
function GearIcon({ color = '#FE4B4A' }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z -= delta * 0.8;
  });

  return (
    <group ref={ref}>
      <mesh>
        <cylinderGeometry args={[0.7, 0.7, 0.25, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.35, 0.35, 0.28, 8]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>
    </group>
  );
}

// Low-poly Shield/Puck for Health
function ShieldIcon({ color = '#10b981' }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.9;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.08;
    }
  });

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.8, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

// Low-poly Warning Crystal for Alerts
function AlertIcon({ color = '#f59e0b' }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 1.2;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
  });

  return (
    <mesh ref={ref}>
      <coneGeometry args={[0.7, 1.2, 4]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.2} metalness={0.7} />
    </mesh>
  );
}

export default function KpiIcon3D({ type = 'gear', color = '#FE4B4A', size = 'w-10 h-10' }) {
  if (!canRender3D()) return null;

  return (
    <div className={`relative ${size} flex-shrink-0 select-none pointer-events-none`}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 3, 2]} intensity={1.5} />
          {type === 'gear' && <GearIcon color={color} />}
          {type === 'shield' && <ShieldIcon color={color} />}
          {type === 'alert' && <AlertIcon color={color} />}
        </Canvas>
      </Suspense>
    </div>
  );
}
