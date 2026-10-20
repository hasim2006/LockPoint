
export interface ARScannerHudProps {
  trackingQualityScore: number; // 0 - 100
  featureCount: number;
  planesCount: number;
  detectedObjectsCount: number;
  guidanceMessage: string;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
}

export function ARScannerHUD({
  trackingQualityScore,
  featureCount,
  planesCount,
  detectedObjectsCount,
  guidanceMessage,
  isScanning,
  onStartScan,
  onStopScan,
}: ARScannerHudProps) {
  const getQualityColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 50) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
      {/* Top Telemetry Bar */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: '10px 16px',
          borderRadius: 12,
          color: '#f8fafc',
          fontSize: 12,
          fontFamily: 'monospace',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: getQualityColor(trackingQualityScore),
            }}
          />
          <span>Scan Quality: {trackingQualityScore}%</span>
        </div>

        <div>
          <span>Features: {featureCount}</span> • <span>Planes: {planesCount}</span>
        </div>
      </div>

      {/* Center Guidance Prompt */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          color: '#38bdf8',
          padding: '8px 18px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 600,
          backdropFilter: 'blur(6px)',
        }}
      >
        {guidanceMessage}
      </div>

      {/* Bottom Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={isScanning ? onStopScan : onStartScan}
          style={{
            backgroundColor: isScanning ? '#ef4444' : '#0284c7',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: 30,
            border: 'none',
            fontSize: 14,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {isScanning ? `Complete Pass (${detectedObjectsCount} Items)` : 'Start Room Scan'}
        </button>
      </div>
    </div>
  );
}
