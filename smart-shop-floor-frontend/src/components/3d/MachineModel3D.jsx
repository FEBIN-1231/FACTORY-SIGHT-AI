import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Color map for machine statuses
const STATUS_COLORS = {
  NORMAL: {
    base: '#10b981',      // Emerald
    emissive: '#059669',
    intensity: 0.4,
  },
  WARNING: {
    base: '#f59e0b',     // Amber
    emissive: '#d97706',
    intensity: 0.6,
  },
  CRITICAL: {
    base: '#ef4444',    // Rose/Red
    emissive: '#dc2626',
    intensity: 0.9,
  },
};

export default function MachineModel3D({
  status = 'NORMAL',
  telemetry = {},
  autoRotate = true,
  onHotspotSelect,
}) {
  const groupRef = useRef();
  const spindleRef = useRef();
  const [activeHotspot, setActiveHotspot] = useState(null);

  // Target and current emissive color for smooth 400ms transition
  const currentColor = useRef(new THREE.Color(STATUS_COLORS.NORMAL.base));
  const targetColor = useMemo(() => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.NORMAL;
    return new THREE.Color(config.base);
  }, [status]);

  // Helper for safe telemetry value formatting
  const fmt = (val, fallback, decimals = 1) => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'number') return val.toFixed(decimals);
    return String(val).replace(/[^0-9.-]+/g, '') || fallback;
  };

  // Sensor hotspot definitions (coordinates positioned on machine model)
  const hotspots = [
    {
      id: 'spindle-temp',
      title: 'Spindle Bearing',
      sensor: 'Temperature',
      value: `${fmt(telemetry.temperature, '72.4', 1)} °C`,
      position: [0, 0.9, 0.45],
      unit: '°C',
    },
    {
      id: 'drive-vibe',
      title: 'Drive Motor',
      sensor: 'Vibration',
      value: `${fmt(telemetry.vibration, '3.82', 2)} mm/s`,
      position: [-0.65, 0.5, -0.3],
      unit: 'mm/s',
    },
    {
      id: 'hyd-press',
      title: 'Hydraulic Manifold',
      sensor: 'Pressure',
      value: `${fmt(telemetry.pressure, '124', 0)} PSI`,
      position: [0.7, -0.2, 0.2],
      unit: 'PSI',
    },
    {
      id: 'inverter-curr',
      title: 'Power Inverter',
      sensor: 'Current',
      value: `${fmt(telemetry.current, '18.5', 1)} A`,
      position: [0, 1.45, -0.1],
      unit: 'A',
    },
  ];

  // Frame update: auto-rotation & smooth color transition
  useFrame((state, delta) => {
    // 1. Smoothly interpolate emissive color (lerp rate ~ 6 * delta ~ 400ms settle)
    currentColor.current.lerp(targetColor, Math.min(delta * 6, 1));

    // 2. Slow idle rotation when enabled
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.18;
    }

    // 3. Subtle continuous tool spin
    if (spindleRef.current) {
      spindleRef.current.rotation.y += delta * 3.0;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.4, 0]}>
      {/* 1. Heavy Machine Base / Bed */}
      <mesh position={[0, -0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.35, 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Base Trim Highlight */}
      <mesh position={[0, -0.32, 0.79]}>
        <boxGeometry args={[2.1, 0.04, 0.04]} />
        <meshStandardMaterial color="#FE4B4A" emissive="#C41E23" emissiveIntensity={0.5} />
      </mesh>

      {/* 2. Machining Table / Slideway */}
      <mesh position={[0, -0.25, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.18, 0.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 3. Main Upright Column (Back) */}
      <mesh position={[0, 0.45, -0.45]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.6, 0.65]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* 4. Top Drive Enclosure / Electronics Header */}
      <mesh position={[0, 1.35, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.35, 0.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* 5. Gantry / Spindle Head Assembly */}
      <mesh position={[0, 0.75, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[0.65, 0.85, 0.65]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 6. Dynamic Status Glowing Ring on Spindle Head */}
      <mesh position={[0, 1.05, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.035, 16, 32]} />
        <meshStandardMaterial
          color={currentColor.current}
          emissive={currentColor.current}
          emissiveIntensity={STATUS_COLORS[status]?.intensity || 0.5}
          roughness={0.2}
        />
      </mesh>

      {/* 7. Spindle Tool Holder & Collet */}
      <mesh position={[0, 0.22, 0.15]}>
        <cylinderGeometry args={[0.16, 0.22, 0.25, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Rotating Chuck & Carbide Endmill */}
      <group ref={spindleRef} position={[0, 0.05, 0.15]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.18, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.035, 0.015, 0.15, 12]} />
          <meshStandardMaterial color="#FE4B4A" metalness={0.9} roughness={0.1} emissive="#C41E23" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* 8. Auxiliary Motor / Hydraulic Reservoir Housing (Left) */}
      <mesh position={[-0.75, -0.1, -0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.55, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* 9. Electrical Conduit Piping */}
      <mesh position={[0.65, 0.4, -0.3]} rotation={[0, 0, Math.PI / 8]}>
        <cylinderGeometry args={[0.04, 0.04, 0.9, 12]} />
        <meshStandardMaterial color="#FE4B4A" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* 10. Sensor Hotspot Nodes */}
      {hotspots.map((h) => {
        const isSelected = activeHotspot === h.id;
        return (
          <group key={h.id} position={h.position}>
            {/* 3D Pulsing Outer Ring */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                const next = isSelected ? null : h.id;
                setActiveHotspot(next);
                if (onHotspotSelect) onHotspotSelect(next ? h : null);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
            >
              <sphereGeometry args={[0.075, 16, 16]} />
              <meshStandardMaterial
                color="#FE4B4A"
                emissive="#FE4B4A"
                emissiveIntensity={isSelected ? 1.5 : 0.8}
                roughness={0.1}
              />
            </mesh>

            {/* Floating HTML Annotation Card on Hover/Click */}
            <Html
              position={[0, 0.18, 0]}
              center
              distanceFactor={6}
              style={{
                pointerEvents: isSelected ? 'auto' : 'none',
                transition: 'all 0.2s ease-out',
                opacity: isSelected ? 1 : 0.85,
                transform: `scale(${isSelected ? 1.05 : 0.95})`,
              }}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveHotspot(isSelected ? null : h.id);
                }}
                className={`px-2.5 py-1.5 rounded-lg border backdrop-blur-md shadow-xl text-left min-w-[110px] cursor-pointer select-none transition-all ${
                  isSelected
                    ? 'bg-slate-900/95 border-[#FE4B4A] ring-1 ring-[#FE4B4A]/50'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-[#FE4B4A]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{h.sensor}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FE4B4A] animate-pulse" />
                </div>
                <div className="text-xs font-mono font-bold text-white mt-0.5">{h.value}</div>
                <div className="text-[8px] text-[#FE4B4A] font-medium truncate">{h.title}</div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
