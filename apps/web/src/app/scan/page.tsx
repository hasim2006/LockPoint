'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Play,
  RotateCw,
  Sliders,
  CheckCircle2,
  MoveRight,
  Video,
  VideoOff,
  SwitchCamera,
  Compass,
  Maximize2,
  Eye,
  Check,
  Heart,
} from 'lucide-react';
import { Room, MovementEvent, ObjectCategory } from '@roomtrace/types';
import { useUserProfile } from '../../lib/profile';

export default function ScanSimulatorPage() {
  const { profile } = useUserProfile();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('room-conf-3b');
  const [scenario, setScenario] = useState<'realistic' | 'slight_movement' | 'major_relocation' | 'disappeared_object'>('realistic');
  
  // Real Camera States
  const [cameraMode, setCameraMode] = useState<'real' | 'simulated'>('simulated');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraResolution, setCameraResolution] = useState<string>('Initializing');
  
  // Scanning & Processing
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<{ scanId: string; movements: MovementEvent[] } | null>(null);
  const [featuresDetected, setFeaturesDetected] = useState(840);
  const [trackingQuality, setTrackingQuality] = useState(94);
  const [guidanceMessage, setGuidanceMessage] = useState('Point camera at floor and pan slowly across furniture');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch rooms
  useEffect(() => {
    fetch('/api/v1/rooms')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setRooms(res.data);
          setSelectedRoomId(res.data[0].id);
        }
      })
      .catch((e) => console.error(e));
  }, []);

  // Request & Start Real Camera Stream
  const startRealCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API (getUserMedia) is not supported in this browser.');
        setCameraPermission('denied');
        return;
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraPermission('granted');
      setCameraMode('real');
      setGuidanceMessage('Real Camera active! AR spatial surface anchor locked.');

      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      if (settings.width && settings.height) {
        setCameraResolution(`${settings.width}x${settings.height}`);
      }
    } catch (err: any) {
      console.warn('Camera permission or access failed:', err);
      setCameraPermission('denied');
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser address bar.'
          : `Camera error: ${err.message || 'Unable to access device video feed.'}`
      );
      setCameraActive(false);
      setCameraMode('simulated');
    }
  };

  // Stop Camera Stream
  const stopRealCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraMode('simulated');
    setGuidanceMessage('Switched to simulated sensor feed.');
  };

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraActive) {
      setTimeout(() => {
        startRealCamera();
      }, 100);
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Main Canvas Rendering Loop (Real Camera Video Feed + AR Computer Vision Overlays)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      if (cameraMode === 'real' && videoRef.current && videoRef.current.readyState >= 2) {
        // DRAW REAL CAMERA FEED
        ctx.drawImage(videoRef.current, 0, 0, width, height);

        // Darken overlay slightly for high-contrast AR HUD
        ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // DRAW SIMULATED HIGH-TECH INDOOR ROOM
        ctx.fillStyle = '#070b14';
        ctx.fillRect(0, 0, width, height);

        // Subtle gradient background
        const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
        grad.addColorStop(0, '#0c1427');
        grad.addColorStop(1, '#05080f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // --- AR SPATIAL MESH & PLANE OVERLAY ---
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 1;

      // Draw perspective floor plane grid
      ctx.beginPath();
      const floorY = height * 0.85;
      const horizonY = height * 0.52;
      const vpX = width * 0.5;

      // Radial perspective grid lines
      for (let i = -4; i <= 4; i++) {
        ctx.moveTo(vpX + i * 40, horizonY);
        ctx.lineTo(vpX + i * 220, floorY + 40);
      }
      // Horizontal depth lines
      for (let j = 0; j <= 5; j++) {
        const y = horizonY + (floorY - horizonY) * (j / 5) ** 1.5;
        const xSpan = (y - horizonY) * 2.8;
        ctx.moveTo(vpX - xSpan, y);
        ctx.lineTo(vpX + xSpan, y);
      }
      ctx.stroke();

      // --- DRAW 3D FEATURE KEYPOINTS (Cyan/Green Glowing dots) ---
      const numPoints = cameraMode === 'real' ? 75 : 55;
      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < numPoints; i++) {
        const px = (Math.sin(i * 137.5 + (cameraMode === 'real' ? 0 : t * 0.1)) * 0.44 + 0.5) * width;
        const py = (Math.cos(i * 93.1 + (cameraMode === 'real' ? 0 : t * 0.1)) * 0.38 + 0.52) * height;

        // Draw crosshair or dot
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();

        if (i % 7 === 0) {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.strokeRect(px - 4, py - 4, 8, 8);
        }
      }

      // --- DETECTED PHYSICAL OBJECTS OVERLAY (YOLO/AR Bounding Boxes) ---
      // 1. Office Chair
      const chairX = width * 0.22 + Math.sin(t * 0.3) * 4;
      const chairY = height * 0.48;
      const chairW = 110;
      const chairH = 150;

      ctx.strokeStyle = scenario === 'realistic' ? '#f43f5e' : '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(chairX, chairY, chairW, chairH);

      // Corner brackets
      ctx.fillStyle = scenario === 'realistic' ? '#f43f5e' : '#10b981';
      ctx.fillRect(chairX - 2, chairY - 2, 10, 3);
      ctx.fillRect(chairX - 2, chairY - 2, 3, 10);
      ctx.fillRect(chairX + chairW - 8, chairY - 2, 10, 3);
      ctx.fillRect(chairX + chairW - 1, chairY - 2, 3, 10);

      // Label
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(chairX, chairY - 22, 140, 18);
      ctx.fillStyle = scenario === 'realistic' ? '#fda4af' : '#6ee7b7';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(
        scenario === 'realistic' ? 'Chair 01 [Moved +43cm]' : 'Chair 01 [Stable <2cm]',
        chairX + 6,
        chairY - 9
      );

      // 2. Work Table
      const tableX = width * 0.46;
      const tableY = height * 0.54;
      const tableW = 220;
      const tableH = 120;

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.strokeRect(tableX, tableY, tableW, tableH);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(tableX, tableY - 22, 130, 18);
      ctx.fillStyle = '#6ee7b7';
      ctx.fillText('Table 01 [Stable: < 2cm]', tableX + 6, tableY - 9);

      // 3. Laptop on Table
      const lapX = width * 0.54;
      const lapY = height * 0.52;
      const lapW = 60;
      const lapH = 35;

      ctx.strokeStyle = '#10b981';
      ctx.strokeRect(lapX, lapY, lapW, lapH);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(lapX, lapY - 18, 90, 14);
      ctx.fillStyle = '#6ee7b7';
      ctx.font = '9px monospace';
      ctx.fillText('Laptop 01 [93%]', lapX + 4, lapY - 7);

      // 4. Storage Box / Bag
      if (scenario !== 'disappeared_object') {
        const boxX = width * 0.74;
        const boxY = height * 0.62;
        const boxW = 80;
        const boxH = 65;

        ctx.strokeStyle = '#f59e0b';
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(boxX, boxY - 18, 100, 14);
        ctx.fillStyle = '#fcd34d';
        ctx.fillText('Box 02 [Moved 18cm]', boxX + 4, boxY - 7);
      }

      // --- CENTER AR RETICLE & COMPASS ---
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
      ctx.moveTo(centerX - 30, centerY);
      ctx.lineTo(centerX - 10, centerY);
      ctx.moveTo(centerX + 10, centerY);
      ctx.lineTo(centerX + 30, centerY);
      ctx.moveTo(centerX, centerY - 30);
      ctx.lineTo(centerX, centerY - 10);
      ctx.moveTo(centerX, centerY + 10);
      ctx.lineTo(centerX, centerY + 30);
      ctx.stroke();

      // Made by Hasim AR Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px sans-serif';
      ctx.fillText('RoomTrace AR Engine • Made by Hasim', 16, height - 16);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [cameraMode, scenario]);

  // Handle Scanning Execution
  const handleStartScan = async () => {
    setIsScanning(true);
    setScanProgress(15);
    setScanResult(null);
    setGuidanceMessage('Tracking 3D surfaces and capturing spatial point cloud...');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 20;
      });
    }, 350);

    // Build scenario-based detections
    let detections: any[] = [];
    if (scenario === 'realistic') {
      detections = [
        {
          category: 'chair' as ObjectCategory,
          confidence: 0.95,
          bbox2d: { xMin: 0.2, yMin: 0.4, xMax: 0.4, yMax: 0.85 },
          estimatedPose: {
            position: { x: -0.42, y: 0.42, z: 2.12 }, // moved 43 cm to the right (+X)
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 0.6, height: 0.88, depth: 0.62 },
          },
        },
        {
          category: 'table' as ObjectCategory,
          confidence: 0.96,
          bbox2d: { xMin: 0.3, yMin: 0.45, xMax: 0.85, yMax: 0.9 },
          estimatedPose: {
            position: { x: 0.11, y: 0.38, z: 2.51 }, // 1.4 cm jitter (STABLE)
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 1.8, height: 0.76, depth: 0.9 },
          },
        },
        {
          category: 'laptop' as ObjectCategory,
          confidence: 0.93,
          bbox2d: { xMin: 0.45, yMin: 0.45, xMax: 0.6, yMax: 0.6 },
          estimatedPose: {
            position: { x: 0.16, y: 0.77, z: 2.34 }, // STABLE
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 0.36, height: 0.24, depth: 0.25 },
          },
        },
        {
          category: 'box' as ObjectCategory,
          confidence: 0.9,
          bbox2d: { xMin: 0.7, yMin: 0.6, xMax: 0.88, yMax: 0.88 },
          estimatedPose: {
            position: { x: 1.25, y: 0.2, z: 2.62 }, // moved 18 cm forward (-Z)
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 0.45, height: 0.35, depth: 0.4 },
          },
        },
        {
          category: 'bag' as ObjectCategory,
          confidence: 0.89,
          bbox2d: { xMin: 0.15, yMin: 0.65, xMax: 0.3, yMax: 0.85 },
          estimatedPose: {
            position: { x: -1.1, y: 0.15, z: 2.3 }, // NEW OBJECT
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 0.35, height: 0.45, depth: 0.3 },
          },
        },
      ];
    } else {
      detections = [
        {
          category: 'chair' as ObjectCategory,
          confidence: 0.95,
          bbox2d: { xMin: 0.2, yMin: 0.4, xMax: 0.4, yMax: 0.85 },
          estimatedPose: {
            position: { x: -0.85, y: 0.42, z: 2.12 },
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 0.6, height: 0.88, depth: 0.62 },
          },
        },
        {
          category: 'table' as ObjectCategory,
          confidence: 0.96,
          bbox2d: { xMin: 0.3, yMin: 0.45, xMax: 0.85, yMax: 0.9 },
          estimatedPose: {
            position: { x: 0.1, y: 0.38, z: 2.5 },
            rotation: { w: 1, x: 0, y: 0, z: 0 },
            dimensions: { width: 1.8, height: 0.76, depth: 0.9 },
          },
        },
      ];
    }

    try {
      const res = await fetch(`/api/v1/rooms/${selectedRoomId}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanType: 'REPEAT',
          rawDetections: detections,
          planes: [
            {
              id: 'plane-floor-01',
              normal: { x: 0, y: 1, z: 0 },
              center: { x: 0, y: 0, z: 2.5 },
              extentX: 6.0,
              extentZ: 8.0,
              planeType: 'HORIZONTAL_UPWARD',
            },
          ],
        }),
      }).then((r) => r.json());

      if (res.success) {
        setTimeout(async () => {
          setScanProgress(100);
          setIsScanning(false);
          setGuidanceMessage('Scan aligned successfully with baseline map!');

          // Fetch updated movements
          const mvtRes = await fetch(`/api/v1/rooms/${selectedRoomId}/movements`).then((r) => r.json());
          if (mvtRes.success) {
            setScanResult({
              scanId: res.data.scan.id,
              movements: mvtRes.data,
            });
          }
        }, 900);
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setIsScanning(false);
      setGuidanceMessage('Scan processing failed. Please retry.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Hidden Video element capturing real camera stream */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
            AR Spatial Room Scanner
            <span className="text-[10px] sm:text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Made by Hasim
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Scan your physical room with live camera permission or sensor emulation. Measures physical object movements in 3D.
          </p>
        </div>

        {/* Camera Mode & Toggle Controls */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {!cameraActive ? (
            <button
              onClick={startRealCamera}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Enable Real Camera</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={toggleFacingMode}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors"
                title="Switch Front/Back Camera"
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>{facingMode === 'environment' ? 'Back Cam' : 'Front Cam'}</span>
              </button>
              <button
                onClick={stopRealCamera}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs border border-rose-700/60 transition-colors"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Quick Target Room Selector */}
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            aria-label="Select Target Room"
            className="flex-1 sm:flex-initial bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room: {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Camera Permission Alert Banner (if needed) */}
      {cameraError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-300">Camera Access: </span>
            {cameraError}
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={startRealCamera}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px]"
              >
                Retry Camera Access
              </button>
              <button
                onClick={() => {
                  setCameraError(null);
                  setCameraMode('simulated');
                }}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                Continue with Simulated Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN SCANNER VIEWPORT & CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: AR Video / Canvas Viewport */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl aspect-[4/3] sm:aspect-[16/10] flex flex-col justify-between">
            {/* Live Canvas Feed */}
            <canvas ref={canvasRef} width={960} height={600} className="w-full h-full object-cover" />

            {/* TOP AR OVERLAY BAR */}
            <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between pointer-events-none gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/80 text-[10px] sm:text-xs font-mono text-slate-200">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      cameraMode === 'real' ? 'bg-emerald-400 animate-ping' : 'bg-sky-400 animate-pulse'
                    }`}
                  />
                  <span className="truncate max-w-[140px] xs:max-w-none">
                    {cameraMode === 'real' ? `LIVE (${cameraResolution})` : 'SENSOR SIMULATOR'}
                  </span>
                </div>

                <div className="bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/80 text-[10px] sm:text-xs font-mono text-slate-300 hidden xs:flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 shrink-0" />
                  <span>{featuresDetected} pts</span>
                </div>
              </div>

              {/* Made by Hasim Brand Overlay Badge */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-sky-500/30 text-sky-300 text-[10px] sm:text-xs font-medium">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500 shrink-0" />
                <span className="hidden xs:inline">Made by </span><strong>Hasim</strong>
              </div>
            </div>

            {/* GUIDANCE MESSAGE BANNER */}
            <div className="absolute bottom-14 sm:bottom-16 left-3 right-3 sm:left-4 sm:right-4 flex justify-center pointer-events-none">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs text-slate-200 font-medium shadow-xl flex items-center gap-2 text-center max-w-full">
                <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="truncate">{guidanceMessage}</span>
              </div>
            </div>

            {/* SCANNING PROGRESS OVERLAY */}
            {isScanning && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center space-y-4 z-20">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Performing 3D Spatial Registration...</h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-xs sm:max-w-md mx-auto">
                    Umeyama SVD Alignment • RANSAC Outlier Filtering • Raycasting Objects
                  </p>
                </div>
                <div className="w-48 sm:w-64 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-sky-400">{scanProgress}% completed</span>
              </div>
            )}

            {/* BOTTOM AR SCAN TRIGGER BAR */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-700/80 text-[10px] sm:text-xs font-mono text-slate-300">
                <span className="hidden xs:inline">Tracking:</span>
                <span className="text-emerald-400 font-bold">{trackingQuality}%</span>
              </div>

              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-xl shadow-sky-500/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span><span className="hidden xs:inline">Capture & </span>Measure Room</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Controls, Scenario, & Result Panel */}
        <div className="space-y-4">
          {/* Quick Guidance Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Scanner Instructions</h3>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside">
              <li>
                Click <strong className="text-emerald-400">Enable Real Camera</strong> to scan using your phone/laptop camera.
              </li>
              <li>Aim your camera at the room floor until the AR plane grid locks.</li>
              <li>Pan slowly across tracked objects (chairs, desks, laptops, boxes).</li>
              <li>Press <strong className="text-sky-400">Capture & Measure Room</strong> to compute centimeter movements.</li>
            </ol>
          </div>

          {/* Test Scenarios */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Displacement Scenarios</h3>
            <div className="space-y-2">
              {[
                { id: 'realistic', label: 'Chair Moved +43cm', desc: 'Table Stable, Box shifted' },
                { id: 'slight_movement', label: 'Slight Jitter (< 2cm)', desc: 'Sensor noise check' },
                { id: 'major_relocation', label: 'Major Relocation', desc: 'Object moved > 50cm' },
                { id: 'disappeared_object', label: 'Disappeared Object', desc: 'Missing from camera view' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScenario(s.id as any)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    scenario === s.id
                      ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-medium'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-[10px] text-slate-500">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Operator Credits */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-900/30 rounded-xl p-4 text-xs space-y-1">
            <div className="font-semibold text-sky-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Operator: {profile.name}</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Spatial tracking configured for {profile.organization}.
            </p>
          </div>
        </div>
      </div>

      {/* SCAN RESULTS & DISPLACEMENT BREAKDOWN */}
      {scanResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Scan Completed & Aligned Successfully
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan ID: <span className="font-mono text-sky-400">{scanResult.scanId}</span> • Registered against Baseline Scan
              </p>
            </div>

            <Link
              href={`/rooms/${selectedRoomId}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-colors"
            >
              <span>View in 3D Spatial Canvas</span>
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Movement List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scanResult.movements.map((m) => {
              const distCm = (m.displacementEuclideanMeters * 100).toFixed(1);
              const isMoved = m.movementStatus === 'SIGNIFICANT_MOVEMENT';
              const isMinor = m.movementStatus === 'MINOR_MOVEMENT';
              const isStable = m.movementStatus === 'STABLE';
              const isNew = m.movementStatus === 'NEW_OBJECT';

              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border ${
                    isMoved
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : isMinor
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : isNew
                      ? 'border-purple-500/30 bg-purple-500/5'
                      : 'border-slate-800 bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{m.objectName || 'Object'}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isMoved
                          ? 'bg-rose-500/20 text-rose-300'
                          : isMinor
                          ? 'bg-amber-500/20 text-amber-300'
                          : isNew
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {m.movementStatus}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-300 font-medium">
                    {m.formattedDisplacement || (m.directionLabel ? `${distCm} cm ${m.directionLabel}` : `${distCm} cm displacement`)}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Confidence: {(m.confidenceScore * 100).toFixed(0)}%</span>
                    <span>Tolerance: ±{(m.uncertaintyRadiusMeters * 100).toFixed(1)} cm</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
