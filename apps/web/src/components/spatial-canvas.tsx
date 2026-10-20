'use client';

import React, { useRef, useEffect, useState } from 'react';
import { TrackedObject, MovementEvent, Vector3D } from '@roomtrace/types';
import { Eye, Compass, Move, CheckCircle2, AlertTriangle, HelpCircle, Layers } from 'lucide-react';

interface SpatialCanvasProps {
  objects: TrackedObject[];
  movements?: MovementEvent[];
  roomDimensions?: { width: number; height: number; depth: number };
  onSelectObject?: (obj: TrackedObject | null, mvt?: MovementEvent | null) => void;
}

export function SpatialCanvas({
  objects,
  movements = [],
  roomDimensions = { width: 6.5, height: 3.0, depth: 8.0 },
  onSelectObject,
}: SpatialCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewAngle, setViewAngle] = useState<{ yaw: number; pitch: number }>({ yaw: 35, pitch: 25 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showVectors, setShowVectors] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  // Map movement events by objectId for fast lookup
  const movementMap = new Map<string, MovementEvent>();
  movements.forEach((m) => movementMap.set(m.objectId, m));

  const selectedObj = objects.find((o) => o.id === selectedId) || null;
  const selectedMvt = selectedId ? movementMap.get(selectedId) || null : null;

  // 3D projection: isometric / perspective camera
  const project3Dto2D = (
    p: Vector3D,
    width: number,
    height: number,
    yawDeg: number,
    pitchDeg: number
  ) => {
    const yaw = (yawDeg * Math.PI) / 180;
    const pitch = (pitchDeg * Math.PI) / 180;

    // Center of room is (0, 0, 0)
    // Rotate around Y axis (yaw)
    const x1 = p.x * Math.cos(yaw) - p.z * Math.sin(yaw);
    const z1 = p.x * Math.sin(yaw) + p.z * Math.cos(yaw);

    // Rotate around X axis (pitch)
    const y2 = p.y * Math.cos(pitch) - z1 * Math.sin(pitch);
    const z2 = p.y * Math.sin(pitch) + z1 * Math.cos(pitch);

    // Scale to canvas pixels
    const scale = Math.min(width, height) / 5.5;
    const screenX = width / 2 + x1 * scale;
    const screenY = height / 2 - y2 * scale; // inverted Y for screen coords

    return { x: screenX, y: screenY, depth: z2 };
  };

  // Window resize observer to ensure crisp 3D re-rendering on all screens and rotations
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        setCanvasDimensions({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI screens
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 240;
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Floor Grid (Meters)
    if (showGrid) {
      const halfW = roomDimensions.width / 2;
      const halfD = roomDimensions.depth / 2;
      const step = 0.5; // 50 cm grid cells

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#1e293b';

      for (let x = -halfW; x <= halfW; x += step) {
        const pStart = project3Dto2D({ x, y: 0, z: -halfD }, width, height, viewAngle.yaw, viewAngle.pitch);
        const pEnd = project3Dto2D({ x, y: 0, z: halfD }, width, height, viewAngle.yaw, viewAngle.pitch);

        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }

      for (let z = -halfD; z <= halfD; z += step) {
        const pStart = project3Dto2D({ x: -halfW, y: 0, z }, width, height, viewAngle.yaw, viewAngle.pitch);
        const pEnd = project3Dto2D({ x: halfW, y: 0, z }, width, height, viewAngle.yaw, viewAngle.pitch);

        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      }

      // Draw Coordinate Origin Axes
      const origin = project3Dto2D({ x: 0, y: 0, z: 0 }, width, height, viewAngle.yaw, viewAngle.pitch);
      const axisX = project3Dto2D({ x: 0.8, y: 0, z: 0 }, width, height, viewAngle.yaw, viewAngle.pitch);
      const axisY = project3Dto2D({ x: 0, y: 0.8, z: 0 }, width, height, viewAngle.yaw, viewAngle.pitch);
      const axisZ = project3Dto2D({ x: 0, y: 0, z: 0.8 }, width, height, viewAngle.yaw, viewAngle.pitch);

      // +X (Right) Red
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(axisX.x, axisX.y);
      ctx.stroke();

      // +Y (Up) Green
      ctx.strokeStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(axisY.x, axisY.y);
      ctx.stroke();

      // +Z (Depth) Blue
      ctx.strokeStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(axisZ.x, axisZ.y);
      ctx.stroke();
    }

    // Sort objects by depth for painter's algorithm
    const sortedObjects = [...objects].sort((a, b) => {
      const posA = a.lastSeenPosition || a.baselinePosition;
      const posB = b.lastSeenPosition || b.baselinePosition;
      const projA = project3Dto2D(posA, width, height, viewAngle.yaw, viewAngle.pitch);
      const projB = project3Dto2D(posB, width, height, viewAngle.yaw, viewAngle.pitch);
      return projA.depth - projB.depth;
    });

    // Draw Objects and Displacement Vectors
    sortedObjects.forEach((obj) => {
      const mvt = movementMap.get(obj.id);
      const basePos = obj.baselinePosition;
      const currPos = obj.lastSeenPosition || basePos;

      const baseProj = project3Dto2D(basePos, width, height, viewAngle.yaw, viewAngle.pitch);
      const currProj = project3Dto2D(currPos, width, height, viewAngle.yaw, viewAngle.pitch);

      const isSelected = obj.id === selectedId;

      // Color coding based on movement status
      let strokeColor = '#10b981'; // Stable
      let fillColor = 'rgba(16, 185, 129, 0.2)';

      if (mvt) {
        if (mvt.movementStatus === 'SIGNIFICANT_MOVEMENT') {
          strokeColor = '#f43f5e'; // Red
          fillColor = 'rgba(244, 63, 94, 0.25)';
        } else if (mvt.movementStatus === 'MINOR_MOVEMENT') {
          strokeColor = '#f59e0b'; // Amber
          fillColor = 'rgba(245, 158, 11, 0.25)';
        } else if (mvt.movementStatus === 'ROTATED_ONLY') {
          strokeColor = '#38bdf8'; // Sky blue
          fillColor = 'rgba(56, 189, 248, 0.25)';
        } else if (mvt.movementStatus === 'NEW_OBJECT') {
          strokeColor = '#a855f7'; // Purple
          fillColor = 'rgba(168, 85, 247, 0.25)';
        } else if (mvt.movementStatus === 'DISAPPEARED') {
          strokeColor = '#64748b'; // Slate
          fillColor = 'rgba(100, 116, 139, 0.2)';
        }
      }

      if (isSelected) {
        strokeColor = '#38bdf8';
        fillColor = 'rgba(56, 189, 248, 0.4)';
      }

      // Draw 3D wireframe bounding box
      const dims = obj.baselineDimensions;
      const hw = dims.width / 2;
      const hh = dims.height;
      const hd = dims.depth / 2;

      // 8 corners of the 3D box at current position
      const corners = [
        { x: currPos.x - hw, y: currPos.y, z: currPos.z - hd },
        { x: currPos.x + hw, y: currPos.y, z: currPos.z - hd },
        { x: currPos.x + hw, y: currPos.y, z: currPos.z + hd },
        { x: currPos.x - hw, y: currPos.y, z: currPos.z + hd },
        { x: currPos.x - hw, y: currPos.y + hh, z: currPos.z - hd },
        { x: currPos.x + hw, y: currPos.y + hh, z: currPos.z - hd },
        { x: currPos.x + hw, y: currPos.y + hh, z: currPos.z + hd },
        { x: currPos.x - hw, y: currPos.y + hh, z: currPos.z + hd },
      ].map((c) => project3Dto2D(c, width, height, viewAngle.yaw, viewAngle.pitch));

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.fillStyle = fillColor;

      // Bottom face
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top face
      ctx.beginPath();
      ctx.moveTo(corners[4].x, corners[4].y);
      ctx.lineTo(corners[5].x, corners[5].y);
      ctx.lineTo(corners[6].x, corners[6].y);
      ctx.lineTo(corners[7].x, corners[7].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Vertical pillars
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(corners[i].x, corners[i].y);
        ctx.lineTo(corners[i + 4].x, corners[i + 4].y);
        ctx.stroke();
      }

      // Draw Displacement Vector Arrow (from baseline to current)
      if (showVectors && mvt && mvt.displacementEuclideanMeters >= 0.02) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(baseProj.x, baseProj.y);
        ctx.lineTo(currProj.x, currProj.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Baseline footprint shadow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(baseProj.x, baseProj.y, 4, 0, Math.PI * 2);
        ctx.stroke();

        // Arrow head pointing to current position
        const angle = Math.atan2(currProj.y - baseProj.y, currProj.x - baseProj.x);
        const headLen = 8;
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(currProj.x, currProj.y);
        ctx.lineTo(currProj.x - headLen * Math.cos(angle - Math.PI / 6), currProj.y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(currProj.x - headLen * Math.cos(angle + Math.PI / 6), currProj.y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      // Label floating above object
      const labelY = corners[4].y - 12;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;

      const labelText = obj.userDefinedName;
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const textWidth = ctx.measureText(labelText).width;

      ctx.beginPath();
      ctx.roundRect(currProj.x - textWidth / 2 - 6, labelY - 14, textWidth + 12, 20, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, currProj.x, labelY);
    });
  }, [objects, movements, roomDimensions, viewAngle, selectedId, showVectors, showGrid, canvasDimensions]);

  // Mouse drag handlers for 3D rotation
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setViewAngle((prev) => ({
      yaw: (prev.yaw + deltaX * 0.5) % 360,
      pitch: Math.max(5, Math.min(85, prev.pitch + deltaY * 0.5)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for Mobile & Tablet touchscreens
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;

    setViewAngle((prev) => ({
      yaw: (prev.yaw + deltaX * 0.5) % 360,
      pitch: Math.max(5, Math.min(85, prev.pitch + deltaY * 0.5)),
    }));
    setDragStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Find closest object
    let closest: TrackedObject | null = null;
    let minDist = 30; // 30px hit radius

    for (const obj of objects) {
      const pos = obj.lastSeenPosition || obj.baselinePosition;
      const proj = project3Dto2D(pos, canvas.clientWidth, canvas.clientHeight, viewAngle.yaw, viewAngle.pitch);
      const dist = Math.sqrt((proj.x - clickX) ** 2 + (proj.y - clickY) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = obj;
      }
    }

    const selectedObj: TrackedObject | null = closest;
    setSelectedId(selectedObj ? selectedObj.id : null);
    if (onSelectObject) {
      const mvt = selectedObj ? movementMap.get(selectedObj.id) || null : null;
      onSelectObject(selectedObj, mvt);
    }
  };

  return (
    <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col select-none">
      {/* 3D Canvas Toolbar (Responsive: wraps on narrow screens) */}
      <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-800 text-[10px] sm:text-xs font-mono text-slate-300 pointer-events-none">
        <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400" />
        <span>Yaw: {Math.round(viewAngle.yaw)}°</span>
        <span className="text-slate-600">|</span>
        <span>Pitch: {Math.round(viewAngle.pitch)}°</span>
      </div>

      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-10 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setShowVectors(!showVectors)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border transition-colors flex items-center gap-1 sm:gap-1.5 ${
            showVectors
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Vectors</span>
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium border transition-colors flex items-center gap-1 sm:gap-1.5 ${
            showGrid
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-slate-900/80 text-slate-400 border-slate-800'
          }`}
        >
          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Grid</span>
        </button>
      </div>

      {/* Main WebGL/2D Canvas with Touch & Mouse events */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Selected Object Inspection Overlay */}
      {selectedObj && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 z-10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-slate-100 text-sm truncate">{selectedObj.userDefinedName}</span>
                <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {selectedObj.persistentId}
                </span>
                {selectedMvt && (
                  <span
                    className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium ${
                      selectedMvt.movementStatus === 'SIGNIFICANT_MOVEMENT'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : selectedMvt.movementStatus === 'MINOR_MOVEMENT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : selectedMvt.movementStatus === 'ROTATED_ONLY'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {selectedMvt.movementStatus.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-slate-400 mt-1">
                Category: <span className="text-slate-200 capitalize">{selectedObj.category}</span> • Dimensions:{' '}
                <span className="font-mono text-slate-300">
                  {selectedObj.baselineDimensions.width.toFixed(2)}m ×{' '}
                  {selectedObj.baselineDimensions.height.toFixed(2)}m ×{' '}
                  {selectedObj.baselineDimensions.depth.toFixed(2)}m
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 w-full md:w-auto justify-between md:justify-start">
            <div>
              <div className="text-slate-400">Baseline 3D Position</div>
              <div className="text-slate-200">
                X: {selectedObj.baselinePosition.x.toFixed(2)}m, Y: {selectedObj.baselinePosition.y.toFixed(2)}m, Z:{' '}
                {selectedObj.baselinePosition.z.toFixed(2)}m
              </div>
            </div>

            {selectedMvt && (
              <div>
                <div className="text-slate-400">Displacement Result</div>
                <div className="text-sky-400 font-bold">{selectedMvt.formattedDisplacement}</div>
                <div className="text-[11px] text-slate-400">Confidence: {selectedMvt.confidenceScore}% (±{Math.round(selectedMvt.uncertaintyRadiusMeters * 100)} cm)</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
