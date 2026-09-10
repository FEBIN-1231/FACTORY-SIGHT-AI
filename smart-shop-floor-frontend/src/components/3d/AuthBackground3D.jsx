import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { canRender3D } from '../../utils/webgl';

function ParticleNodes() {
  const pointsRef = useRef();
  const linesRef = useRef();

  // Generate 45 subtle nodes in a 3D volume
  const { positions, linePositions } = useMemo(() => {
    const count = 45;
    const pos = new Float32Array(count * 3);
    const coords = [];

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 10;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      coords.push(new THREE.Vector3(x, y, z));
    }

    // Connect close nodes with lines
    const lineCoords = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (coords[i].distanceTo(coords[j]) < 4.2) {
          lineCoords.push(coords[i].x, coords[i].y, coords[i].z);
          lineCoords.push(coords[j].x, coords[j].y, coords[j].z);
        }
      }
    }

    return {
      positions: pos,
      linePositions: new Float32Array(lineCoords),
    };
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * 0.04;
      linesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    }
  });

  return (
    <group>
      {/* Drifting Nodes */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#FE4B4A"
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>

      {/* Connecting Wireframe Lattice */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#C41E23"
          transparent
          opacity={0.15}
        />
      </lineSegments>
    </group>
  );
}

export default function AuthBackground3D() {
  if (!canRender3D()) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, 7], fov: 60 }}
          dpr={[1, 1.2]}
          gl={{ antialias: false, alpha: true }}
          className="w-full h-full"
        >
          <ParticleNodes />
        </Canvas>
      </Suspense>
    </div>
  );
}
