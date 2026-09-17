import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import MetricCard from '../components/MetricCard';
import Table from '../components/Table';
import { SkeletonGrid } from '../components/SkeletonLoader';
import {
  ScanEye,
  CheckCircle2,
  AlertTriangle,
  Check,
  Camera,
  Filter,
  Sparkles,
  Radio,
  Layers,
  RefreshCw,
  Zap,
  Upload,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  buttonTap,
  listItemVariant,
  sequenceHeader,
  sequenceSection,
  staggerContainer,
} from '../components/motion';

// Cloud-ready Computer Vision API configuration (no hardcoded localhost in production)
const CV_API_URL = (
  import.meta.env.VITE_CV_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://factory-sight-ai.onrender.com'
).replace(/\/+$/, '');
const CV_DETECT_URL = `${CV_API_URL}/detect`;

const MACHINES = [
  { id: 'M-01', name: 'M-01 (CNC Milling Center)' },
  { id: 'M-02', name: 'M-02 (Hydraulic Press)' },
  { id: 'M-03', name: 'M-03 (Laser Scribing Unit)' },
  { id: 'M-04', name: 'M-04 (Surface Grinder)' },
];

export default function Defects() {
  const [defects, setDefects] = useState([]);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedMachine, setSelectedMachine] = useState('M-03');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);

  // Browser-side camera & snapshot states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [capturedDimensions, setCapturedDimensions] = useState({ width: 640, height: 480 });
  const [lastAnalysisDefects, setLastAnalysisDefects] = useState([]);
  const [inspectionOutcome, setInspectionOutcome] = useState(null); // 'DEFECT' | 'NOMINAL' | null

  // In-flight inspection state & cold-start tracking
  const [isScanningFrame, setIsScanningFrame] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState('Running YOLOv8 Inspection...');

  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamTrackRef = useRef(null);

  const [liveStatus, setLiveStatus] = useState({
    status: 'online',
    fps: 30.0,
    camera: 'Browser WebRTC Camera',
    machine: 'M-03 (Laser Scribing Unit)',
    total_defects: 0,
    latency_ms: 120,
    model: 'YOLOv8 defect_best.pt',
  });

  // Start local browser webcam using MediaDevices API
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
        audio: false,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      localStreamTrackRef.current = stream;
      setCameraActive(true);
      setLiveStatus((prev) => ({ ...prev, status: 'online', camera: 'Browser WebRTC Camera' }));
    } catch (err) {
      console.error('Webcam initialization failed:', err);
      setCameraActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Webcam permission was denied. Please allow camera permissions in your browser URL bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No webcam hardware detected on this device. You can still inspect components via "Upload Image".');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Webcam is currently in use by another application. Close other programs using the camera and click Retry.');
      } else {
        setCameraError(`Could not access webcam: ${err.message || 'Unknown device error'}`);
      }
    }
  };

  useEffect(() => {
    startCamera();
    setLoading(false);

    return () => {
      if (localStreamTrackRef.current) {
        localStreamTrackRef.current.getTracks().forEach((t) => t.stop());
        localStreamTrackRef.current = null;
      }
    };
  }, []);

  // Return to live camera feed
  const handleReturnToLive = () => {
    setCapturedImageUrl(null);
    setLastAnalysisDefects([]);
    setInspectionOutcome(null);
  };

  // Manual "Capture & Inspect Frame" flow
  const handleScanFrame = async () => {
    if (isScanningFrame || isUploadingImage) return;

    if (!localVideoRef.current || !cameraActive) {
      setFeedback('Camera video feed is not active. Please start the webcam or upload an image.');
      return;
    }

    const video = localVideoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setFeedback('Camera feed is still initializing. Please wait a moment and try again.');
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    const snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImageUrl(snapshotDataUrl);
    setCapturedDimensions({ width, height });

    setIsScanningFrame(true);
    setScanStatusMessage('Capturing & Running YOLOv8 Inspection...');

    // Render free-tier cold-start notification if network takes > 3.5 seconds
    const coldStartTimer = setTimeout(() => {
      setScanStatusMessage('Waking up cloud neural service on Render, please wait...');
    }, 3500);

    const startTime = performance.now();

    try {
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.90));
      if (!blob) throw new Error('Could not create image blob from video frame');

      const formData = new FormData();
      formData.append('machine_id', selectedMachine);
      formData.append('file', blob, 'camera_capture.jpg');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s timeout for cold start

      const response = await fetch(CV_DETECT_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        const result = await response.json();
        setLiveStatus((prev) => ({
          ...prev,
          latency_ms: latency,
          total_defects: result.total_defects || 0,
        }));

        if (result.defects && result.defects.length > 0) {
          setLastAnalysisDefects(result.defects);
          setInspectionOutcome('DEFECT');

          const newDets = result.defects.map((d, idx) => ({
            id: `CAM-${Date.now().toString().slice(-4)}-${idx + 1}`,
            class: d.type,
            type: d.type,
            defectType: d.type.toUpperCase(),
            confidence: `${(d.confidence * 100).toFixed(1)}%`,
            severity: d.severity,
            machine: `${selectedMachine} (${selectedMachine === 'M-03' ? 'Laser Scribing' : 'Manufacturing Line'})`,
            camera: 'Live WebRTC Camera Capture',
            category: d.type.toUpperCase(),
            verified: false,
            timestamp: new Date().toLocaleTimeString(),
            notes: `YOLOv8 detected ${d.type.toUpperCase()} with ${d.severity} severity.`,
            bounding_box: d.bounding_box,
          }));

          setDefects((prev) => [...newDets, ...prev]);
          setSelectedDefect(newDets[0]);
          setFeedback(`Inspection Complete: Flagged ${result.total_defects} defect(s) in ${latency}ms (${result.highest_severity} severity).`);
        } else {
          setLastAnalysisDefects([]);
          setInspectionOutcome('NOMINAL');
          setFeedback(`Inspection Complete: Machine part is verified NOMINAL (Zero defects detected in ${latency}ms).`);
        }
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Detection request failed:', err);
      const isTimeout = err.name === 'AbortError';
      setFeedback(
        isTimeout
          ? 'Cloud service timeout: The Render container is cold-starting. Please retry once more.'
          : 'Detection service is temporarily unavailable or sleeping on Render. Please verify connection and retry.'
      );
    } finally {
      clearTimeout(coldStartTimer);
      setIsScanningFrame(false);
      setTimeout(() => setFeedback(''), 6000);
    }
  };

  // Upload Custom Image for YOLO Defect Detection
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setScanStatusMessage('Uploading and analyzing image with YOLOv8...');

    // Load image for preview & bounding box coordinate reference
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setCapturedDimensions({ width: img.naturalWidth || 640, height: img.naturalHeight || 480 });
      };
      img.src = e.target.result;
      setCapturedImageUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    const coldStartTimer = setTimeout(() => {
      setScanStatusMessage('Waking up cloud neural service on Render, please wait...');
    }, 3500);

    const startTime = performance.now();

    try {
      const formData = new FormData();
      formData.append('machine_id', selectedMachine);
      formData.append('file', file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 40000);

      const response = await fetch(CV_DETECT_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        const result = await response.json();
        setLiveStatus((prev) => ({
          ...prev,
          latency_ms: latency,
          total_defects: result.total_defects || 0,
        }));

        if (result.defects && result.defects.length > 0) {
          setLastAnalysisDefects(result.defects);
          setInspectionOutcome('DEFECT');

          const newDets = result.defects.map((d, idx) => ({
            id: `UPL-${Date.now().toString().slice(-4)}-${idx + 1}`,
            class: d.type,
            type: d.type,
            defectType: d.type.toUpperCase(),
            confidence: `${(d.confidence * 100).toFixed(1)}%`,
            severity: d.severity,
            machine: `${selectedMachine} (${selectedMachine === 'M-03' ? 'Laser Scribing' : 'Custom Inspection'})`,
            camera: 'Uploaded Image Inspection',
            category: d.type.toUpperCase(),
            verified: false,
            timestamp: new Date().toLocaleTimeString(),
            notes: `Classified via YOLOv8 defect model (${d.severity} severity).`,
            bounding_box: d.bounding_box,
          }));

          setDefects((prev) => [...newDets, ...prev]);
          setSelectedDefect(newDets[0]);
          setFeedback(`Inspection Complete: Flagged ${result.total_defects} defect(s) on ${file.name} (${latency}ms).`);
        } else {
          setLastAnalysisDefects([]);
          setInspectionOutcome('NOMINAL');
          setFeedback(`Inspection Complete: Image ${file.name} is verified NOMINAL (Zero defects detected in ${latency}ms).`);
        }
      } else {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Image defect scan failed:', err);
      const isTimeout = err.name === 'AbortError';
      setFeedback(
        isTimeout
          ? 'Cloud service timeout: Render instance may still be waking up. Please retry.'
          : 'Could not connect to YOLOv8 Detection API on Render. Please verify service availability.'
      );
    } finally {
      clearTimeout(coldStartTimer);
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setFeedback(''), 6000);
    }
  };

  const handleVerify = (defectId) => {
    setDefects((prev) =>
      prev.map((d) => (d.id === defectId ? { ...d, verified: true } : d))
    );
    if (selectedDefect?.id === defectId) {
      setSelectedDefect((prev) => ({ ...prev, verified: true }));
    }
    setFeedback(`Defect ${defectId} successfully verified & logged to Quality Audit.`);
    setTimeout(() => setFeedback(''), 4000);
  };

  const categories = ['ALL', 'Crack', 'Hole', 'Rust', 'Scratch', 'Dent'];

  const filteredDefects =
    categoryFilter === 'ALL'
      ? defects
      : defects.filter((d) => {
          const cls = (d.class || d.type || d.defectType || '').toLowerCase();
          return cls.includes(categoryFilter.toLowerCase());
        });

  const columns = [
    {
      header: 'Defect ID',
      key: 'id',
      render: (r) => <span className="font-mono font-bold text-[var(--brand-accent)]">{r.id}</span>,
    },
    { header: 'Timestamp', key: 'timestamp', className: 'font-mono text-slate-400 text-[11px]' },
    { header: 'Machine', key: 'machine', render: (r) => <span className="font-semibold text-slate-200">{r.machine}</span> },
    {
      header: 'Classification',
      key: 'defectType',
      render: (r) => {
        const cls = (r.class || r.defectType || r.type || 'Defect').toUpperCase();
        return (
          <span className="font-bold text-white font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            {cls}
          </span>
        );
      },
    },
    {
      header: 'Confidence',
      key: 'confidence',
      render: (r) => {
        const confStr = typeof r.confidence === 'string' && r.confidence.endsWith('%') ? r.confidence : `${r.confidence}%`;
        return <span className="font-mono font-bold text-[var(--brand-accent)]">{confStr}</span>;
      },
    },
    {
      header: 'Severity',
      key: 'severity',
      render: (r) => {
        const sev = (r.severity || 'Medium').toUpperCase();
        const isHigh = sev === 'HIGH' || sev === 'CRITICAL';
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
              isHigh
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            }`}
          >
            {sev}
          </span>
        );
      },
    },
    {
      header: 'Verification',
      key: 'verified',
      render: (r) =>
        r.verified ? (
          <span className="text-[11px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Verified
          </span>
        ) : (
          <span className="text-[11px] text-amber-400 font-semibold font-mono">Pending Review</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
        <SkeletonGrid count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Sample Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Header Banner with Stream Status & Camera Controls */}
      <motion.div
        variants={sequenceHeader}
        initial="initial"
        animate="animate"
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-850 p-6 rounded-2xl border border-slate-750 shadow-md"
      >
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] uppercase flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              Browser-Side Neural Optical Inspection
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Cloud Engine: <code className="text-[var(--brand-accent)] font-bold">Render YOLOv8</code>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Latency: <span className="text-emerald-400 font-bold">{liveStatus.latency_ms}ms</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Automated Optical Quality Inspection & Defect Detection
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browser captures frames locally via WebRTC and sends snapshots to YOLOv8 <code className="text-[var(--brand-accent)]">/detect</code>
          </p>
        </div>

        {/* Action Controls & Machine Selector */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Target Machine Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              {MACHINES.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Image Button */}
          <motion.button
            whileTap={buttonTap}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage || isScanningFrame}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Upload an image from disk for inspection"
          >
            {isUploadingImage ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--brand-accent)]" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                <span>Upload Image</span>
              </>
            )}
          </motion.button>

          {/* Primary Action: Capture & Inspect Frame */}
          <motion.button
            whileTap={buttonTap}
            onClick={handleScanFrame}
            disabled={isScanningFrame || isUploadingImage || !cameraActive}
            className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-accent)] text-white font-mono text-xs font-bold shadow-lg shadow-[var(--brand-glow)] flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
            title="Capture current video frame and run YOLOv8 defect detection"
          >
            {isScanningFrame ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Inspecting...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Capture &amp; Inspect Frame</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* User Feedback Alert */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            variants={listItemVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            className="p-4 rounded-xl bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand-accent)] text-xs flex items-center gap-2 font-mono"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--brand-accent)]" />
            <span>{feedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Row */}
      <motion.div
        variants={staggerContainer(0.05, 0.1)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <MetricCard
          title="Overall Line Yield"
          value="98.85%"
          subtitle="Model classes: Crack, Hole, Rust, Scratch, Normal"
          trend="+0.4%"
          icon={ScanEye}
          status="healthy"
        />
        <MetricCard
          title="Active Model"
          value="defect_best.pt"
          subtitle={`Cloud inference latency: ${liveStatus.latency_ms}ms`}
          trend="YOLOv8 Active"
          icon={Sparkles}
          status="normal"
        />
        <MetricCard
          title="Active Defect Flags"
          value={defects.length}
          subtitle={`${liveStatus.total_defects} anomalies logged`}
          trend={defects.length > 0 ? 'Defects Flagged' : 'Nominal'}
          icon={AlertTriangle}
          status={defects.length > 0 ? 'warning' : 'healthy'}
        />
      </motion.div>

      {/* Main Two-Column: Live Camera / Analyzed Frame + Defect Register */}
      <motion.div
        variants={sequenceSection(0.25)}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Left Column: Camera / Inspection Feed */}
        <div className="lg:col-span-6 space-y-4">
          <Card
            title={capturedImageUrl ? 'Analyzed Inspection Frame' : 'Live Operator Camera (WebRTC)'}
            subtitle={
              capturedImageUrl
                ? `Static captured frame with YOLOv8 bounding boxes • ${selectedMachine}`
                : `Live browser camera stream • Target: ${selectedMachine}`
            }
            badge={
              capturedImageUrl ? (
                <span className="flex items-center gap-1.5 text-[var(--brand-accent)] font-mono text-[11px] font-bold">
                  SNAPSHOT VIEW
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE CAMERA
                </span>
              )
            }
            variant="accent"
            enableHoverLift={true}
          >
            <div className="space-y-4">
              {/* Screen Container */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-[var(--brand-border)] bg-slate-950 shadow-2xl shadow-[var(--brand-glow)] flex items-center justify-center">
                {/* Mode 1: Displaying captured snapshot with bounding box overlay */}
                {capturedImageUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <img
                      src={capturedImageUrl}
                      alt="Captured Inspection Frame"
                      className="w-full h-full object-contain"
                    />

                    {/* SVG Bounding Box Layer */}
                    {capturedDimensions.width > 0 && (
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox={`0 0 ${capturedDimensions.width} ${capturedDimensions.height}`}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {lastAnalysisDefects.map((defect, idx) => {
                          if (!defect.bounding_box) return null;
                          const { x1, y1, x2, y2 } = defect.bounding_box;
                          const bw = Math.max(2, x2 - x1);
                          const bh = Math.max(2, y2 - y1);
                          const sev = (defect.severity || 'Medium').toUpperCase();
                          const strokeColor =
                            sev === 'CRITICAL' || sev === 'HIGH'
                              ? '#ef4444'
                              : sev === 'MEDIUM'
                              ? '#f59e0b'
                              : '#10b981';
                          const fillColor =
                            sev === 'CRITICAL' || sev === 'HIGH'
                              ? 'rgba(239, 68, 68, 0.20)'
                              : sev === 'MEDIUM'
                              ? 'rgba(245, 158, 11, 0.20)'
                              : 'rgba(16, 185, 129, 0.20)';

                          const conf =
                            typeof defect.confidence === 'number'
                              ? `${(defect.confidence * 100).toFixed(1)}%`
                              : defect.confidence || '';
                          const label = `${(defect.type || 'DEFECT').toUpperCase()} ${conf} [${sev}]`;

                          return (
                            <g key={idx}>
                              <rect
                                x={x1}
                                y={y1}
                                width={bw}
                                height={bh}
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth="3"
                                rx="4"
                              />
                              {/* Label pill background */}
                              <rect
                                x={x1}
                                y={Math.max(0, y1 - 22)}
                                width={Math.min(bw + 60, 220)}
                                height="20"
                                fill={strokeColor}
                                rx="3"
                              />
                              <text
                                x={x1 + 6}
                                y={Math.max(14, y1 - 7)}
                                fill="#ffffff"
                                fontSize="11"
                                fontFamily="monospace"
                                fontWeight="bold"
                              >
                                {label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    )}

                    {/* Nominal Verification Badge */}
                    {inspectionOutcome === 'NOMINAL' && !isScanningFrame && (
                      <div className="absolute top-3 left-3 bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[11px] font-mono font-bold text-emerald-300">
                          VERIFIED NOMINAL — ZERO DEFECTS
                        </span>
                      </div>
                    )}

                    {/* Return to Live Camera Control */}
                    <button
                      onClick={handleReturnToLive}
                      className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-mono text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                      <span>Return to Live Camera</span>
                    </button>
                  </div>
                ) : cameraError ? (
                  /* Mode 2: Camera Unavailable / Permission Denied */
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white font-mono">Camera Feed Unavailable</h4>
                      <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                        {cameraError}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 pt-1">
                      <button
                        onClick={startCamera}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[var(--brand-accent)]" />
                        Retry Camera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] font-mono text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload Image Instead
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Mode 3: Live Operator Webcam */
                  <div className="relative w-full h-full bg-black">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Live Badge */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono text-[var(--brand-accent)] border border-[var(--brand-border)] shadow-md">
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span className="font-bold text-white tracking-wider">LIVE BROWSER FEED</span>
                    </div>

                    {/* Target Machine HUD */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-mono border border-slate-800 text-slate-300">
                      <span className="text-[var(--brand-accent)] font-semibold flex items-center gap-1.5">
                        <Layers className="w-3 h-3 text-[var(--brand-accent)]" />
                        Target: {selectedMachine}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        Click &quot;Capture &amp; Inspect Frame&quot; to inspect
                      </span>
                    </div>
                  </div>
                )}

                {/* Laser Scanning & Cold Start Overlay */}
                {(isScanningFrame || isUploadingImage) && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-44 h-1 bg-gradient-to-r from-transparent via-[var(--brand-accent)] to-transparent animate-pulse mb-4 shadow-[0_0_15px_var(--brand-accent)]" />
                    <RefreshCw className="w-8 h-8 text-[var(--brand-accent)] animate-spin mb-3" />
                    <h4 className="text-sm font-bold text-white font-mono">{scanStatusMessage}</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs font-mono">
                      Running inference on YOLOv8 neural pipeline...
                    </p>
                  </div>
                )}
              </div>

              {/* Inspection Architecture Metadata Card */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono">Capture Mode:</span>
                  <span className="font-bold text-[var(--brand-accent)] font-mono text-[11px]">
                    {capturedImageUrl ? 'Frozen Frame Snapshot' : 'Browser WebRTC MediaDevices'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono">YOLO Endpoint:</span>
                  <span className="font-bold text-emerald-400 font-mono text-[11px] truncate max-w-[240px]">
                    {CV_DETECT_URL}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono">Neural Weights:</span>
                  <span className="text-slate-200 font-mono font-semibold">defect_best.pt (YOLOv8)</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-400 text-[11px] leading-relaxed">
                  <span className="text-slate-300 font-semibold font-mono">Cloud Architecture: </span>
                  Camera frames are captured in-browser and posted directly as multipart data to Render. Detected anomalies are highlighted with color-coded bounding boxes according to severity.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Defect Register & Inspector */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Defect Filter:
            </span>
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={buttonTap}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer font-mono ${
                  categoryFilter === cat
                    ? 'bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)] shadow-sm'
                    : 'bg-slate-850 text-slate-400 border border-slate-750 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          <Card
            title={`Defect Register (${filteredDefects.length} detections)`}
            badge={
              filteredDefects.length === 0 ? (
                <span className="text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Nominal
                </span>
              ) : (
                <span className="text-amber-400 font-mono text-[10px] font-semibold">
                  {filteredDefects.length} Flagged
                </span>
              )
            }
            enableHoverLift={true}
          >
            {filteredDefects.length > 0 ? (
              <div className="space-y-4">
                <Table
                  columns={columns}
                  rows={filteredDefects}
                  onRowClick={(row) => setSelectedDefect(row)}
                />

                {/* Selected Defect Detail Card */}
                {selectedDefect && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-[var(--brand-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--brand-subtle)] text-[var(--brand-accent)] border border-[var(--brand-border)]">
                          {selectedDefect.id}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {(selectedDefect.class || selectedDefect.defectType || selectedDefect.type || 'Defect').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[var(--brand-accent)]">
                        {typeof selectedDefect.confidence === 'string' && selectedDefect.confidence.endsWith('%')
                          ? selectedDefect.confidence
                          : `${selectedDefect.confidence}%`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                      <div>Machine: <span className="text-slate-200">{selectedDefect.machine || selectedMachine}</span></div>
                      <div>Timestamp: <span className="text-slate-200">{selectedDefect.timestamp}</span></div>
                    </div>

                    <p className="text-xs text-slate-300">
                      {selectedDefect.notes || 'Optical defect classification captured by YOLOv8 vision pipeline.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Status: {selectedDefect.verified ? 'Verified' : 'Unverified'}
                      </span>
                      {!selectedDefect.verified && (
                        <button
                          onClick={() => handleVerify(selectedDefect.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold font-mono flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Verified
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white font-mono">Zero Active Defect Flags</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click &quot;Capture &amp; Inspect Frame&quot; or upload an image to run automated YOLOv8 defect detection on the manufacturing part.
                </p>
              </div>
            )}
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
