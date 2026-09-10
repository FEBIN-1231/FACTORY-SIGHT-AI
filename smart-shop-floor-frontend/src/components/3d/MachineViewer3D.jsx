import React, { Suspense, useState, useRef, Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import MachineModel3D from './MachineModel3D';
import CanvasFallback from './CanvasFallback';
import { canRender3D } from '../../utils/webgl';

// Error Boundary for 3D Context Crashes
class ThreeErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('3D Canvas Error Boundary caught WebGL fault:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <CanvasFallback
          machineId={this.props.machineId}
          status={this.props.status}
          telemetry={this.props.telemetry}
          message="WebGL context unavailable. Displaying 2D schematic."
        />
      );
    }
    return this.props.children;
  }
}

export default function MachineViewer3D({
  machineId = 'M-01',
  status = 'NORMAL',
  telemetry = {},
  className = 'h-[360px]',
}) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState(null);
  const controlsRef = useRef();

  // If system/browser cannot or should not render 3D
  if (!canRender3D()) {
    return (
      <CanvasFallback
        machineId={machineId}
        status={status}
        telemetry={telemetry}
        message="Reduced-motion active or WebGL disabled."
      />
    );
  }

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const statusThemes = {
    NORMAL: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    WARNING: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    CRITICAL: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  };

  return (
    <ThreeErrorBoundary machineId={machineId} status={status} telemetry={telemetry}>
      <div className={`relative w-full rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 border border-slate-800/90 shadow-2xl overflow-hidden select-none group ${className}`}>
        {/* Subtle Tech Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#FE4B4A 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* 3D Canvas Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-slate-900/90 border border-slate-700/80 text-white shadow-md backdrop-blur-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-accent)] animate-pulse" />
              {machineId} Digital Twin (3D)
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border backdrop-blur-md ${statusThemes[status] || statusThemes.NORMAL}`}>
              {status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? 'Pause auto-rotation' : 'Enable auto-rotation'}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border backdrop-blur-md transition-all cursor-pointer ${
                autoRotate
                  ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border-[var(--brand-border)] shadow-sm shadow-[var(--brand-glow)]'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700/80 hover:text-white'
              }`}
            >
              {autoRotate ? '↻ Auto-Orbit' : '⏸ Static'}
            </button>
            <button
              onClick={handleResetCamera}
              title="Reset view angle"
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-900/80 text-slate-300 border border-slate-700/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Three.js Canvas */}
        <Suspense fallback={<CanvasFallback machineId={machineId} status={status} telemetry={telemetry} message="Loading 3D Engine..." />}>
          <Canvas
            shadows
            camera={{ position: [3.2, 2.2, 3.8], fov: 42 }}
            dpr={[1, 1.5]}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            {/* Lighting Setup */}
            <ambientLight intensity={0.75} />
            <directionalLight position={[6, 8, 5]} intensity={1.4} castShadow shadow-mapSize={[512, 512]} />
            <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#FE4B4A" />
            <pointLight position={[0, 2.5, 2]} intensity={0.6} color="#C41E23" />

            {/* Orbit Controls with Damping & Clamped Pitch */}
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableDamping={true}
              dampingFactor={0.05}
              minDistance={2.8}
              maxDistance={6.5}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 2.05}
              onStart={() => setAutoRotate(false)}
            />

            {/* 3D Machine Component */}
            <MachineModel3D
              status={status}
              telemetry={telemetry}
              autoRotate={autoRotate}
              onHotspotSelect={setSelectedSensor}
            />

            {/* Contact Floor Shadow */}
            <ContactShadows
              position={[0, -0.92, 0]}
              opacity={0.65}
              scale={6}
              blur={1.8}
              far={2.5}
              color="#020617"
            />
          </Canvas>
        </Suspense>

        {/* Bottom Interaction Guide */}
        <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between text-[11px] text-slate-400 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-accent)]" />
            <span>Click glowing nodes for telemetry • Drag to rotate 3D view</span>
          </div>

          {selectedSensor && (
            <div className="font-mono text-[var(--brand-accent)] font-bold bg-[var(--bg-card)] px-2 py-0.5 rounded border border-[var(--brand-border)] pointer-events-auto">
              {selectedSensor.sensor}: {selectedSensor.value}
            </div>
          )}
        </div>
      </div>
    </ThreeErrorBoundary>
  );
}
