import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Layers,
  Activity,
  RefreshCw,
  Eye,
  AlertTriangle,
  Pill,
  Zap,
  Cpu,
} from 'lucide-react';

interface MedicineDemoSpecimen {
  id: string;
  brandName: string;
  genericName: string;
  dosage: string;
  manufacturer: string;
  schedule: 'Schedule H' | 'Schedule H1' | 'OTC';
  activeSalts: string[];
  therapeuticClass: string;
  batchNumber: string;
  expiryDate: string;
  mrp: string;
  hindiSummary: string;
  accentColor: string;
  confidenceScore: number;
}

const DEMO_SPECIMENS: MedicineDemoSpecimen[] = [
  {
    id: 'allegra-120',
    brandName: 'Allegra 120mg',
    genericName: 'Fexofenadine Hydrochloride Tablets IP',
    dosage: '120 mg Tablet',
    manufacturer: 'Sanofi India Ltd.',
    schedule: 'Schedule H',
    activeSalts: ['Fexofenadine HCl (120 mg)'],
    therapeuticClass: 'Anti-Allergic / Antihistamine',
    batchNumber: 'AG2409',
    expiryDate: '08/2027',
    mrp: '₹224.50',
    hindiSummary: 'एलर्जी, छींक और बहती नाक में राहत हेतु उपयोगी।',
    accentColor: '#1769E0',
    confidenceScore: 99.4,
  },
  {
    id: 'augmentin-625',
    brandName: 'Augmentin 625 Duo',
    genericName: 'Amoxycillin and Potassium Clavulanate IP',
    dosage: '500 mg + 125 mg Tablet',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd.',
    schedule: 'Schedule H1',
    activeSalts: ['Amoxicillin (500 mg)', 'Potassium Clavulanate (125 mg)'],
    therapeuticClass: 'Broad-Spectrum Antibiotic',
    batchNumber: 'AUG883',
    expiryDate: '11/2026',
    mrp: '₹204.00',
    hindiSummary: 'जीवाणु संक्रमण (बैक्टीरियल इन्फेक्शन) के इलाज हेतु डॉक्टर द्वारा निर्धारित।',
    accentColor: '#C84747',
    confidenceScore: 98.8,
  },
];

export const MedicalAIVisual: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [scanPulse, setScanPulse] = useState(0);

  // Real-time fluctuating AI model telemetry
  const [latencyMs, setLatencyMs] = useState(23);
  const [fps, setFps] = useState(60.1);
  const [confidenceOffset, setConfidenceOffset] = useState(0);
  const [vectorTokens, setVectorTokens] = useState(14820);
  const [cosineSimilarity, setCosineSimilarity] = useState(0.9874);
  const [roiCoords, setRoiCoords] = useState({ x: 142.4, y: 78.6, w: 284.2, h: 112.5 });
  const [neuralBars, setNeuralBars] = useState([45, 80, 55, 92, 68, 85, 48, 96]);

  const specimen = DEMO_SPECIMENS[selectedIdx];

  // Dynamic interval to simulate active AI neural processing
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      // 1. Latency fluctuation between 19ms and 31ms
      setLatencyMs((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        const next = prev + delta;
        return Math.max(18, Math.min(32, next));
      });

      // 2. Framerate micro-jitter between 59.3 and 60.7 FPS
      setFps((prev) => {
        const delta = Math.random() * 0.8 - 0.4;
        const next = +(prev + delta).toFixed(1);
        return Math.max(59.2, Math.min(60.8, next));
      });

      // 3. Confidence score micro-fluctuation (+/- 0.35%)
      setConfidenceOffset((prev) => {
        const delta = Math.random() * 0.3 - 0.15;
        const next = prev + delta;
        return +(Math.max(-0.35, Math.min(0.25, next))).toFixed(2);
      });

      // 4. Cosine similarity fluctuation (0.9830 to 0.9930)
      setCosineSimilarity((prev) => {
        const delta = Math.random() * 0.002 - 0.001;
        const next = prev + delta;
        return +(Math.max(0.9825, Math.min(0.9935, next))).toFixed(4);
      });

      // 5. Active ROI tracker coordinate jitter
      setRoiCoords((prev) => ({
        x: +(prev.x + (Math.random() * 0.8 - 0.4)).toFixed(1),
        y: +(prev.y + (Math.random() * 0.6 - 0.3)).toFixed(1),
        w: +(prev.w + (Math.random() * 0.4 - 0.2)).toFixed(1),
        h: +(prev.h + (Math.random() * 0.4 - 0.2)).toFixed(1),
      }));

      // 6. Vector embeddings / tokens processed steadily ticking up
      setVectorTokens((prev) => prev + Math.floor(Math.random() * 5) + 1);

      // 7. Neural waveform visualizer bars
      setNeuralBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 65) + 35)
      );
    }, 240);

    return () => clearInterval(telemetryInterval);
  }, []);

  const handleSimulateRescan = () => {
    setIsScanning(false);
    setScanPulse((prev) => prev + 1);
    setTimeout(() => {
      setIsScanning(true);
    }, 150);
  };

  const currentConfidence = +(specimen.confidenceScore + confidenceOffset).toFixed(2);
  const brandConfidence = +(99.8 + confidenceOffset * 0.4).toFixed(2);
  const saltConfidence = +(99.4 + confidenceOffset * 0.3).toFixed(2);

  return (
    <div className="relative w-full max-w-lg mx-auto select-none">
      {/* Dynamic ambient clinical glow */}
      <div
        className="absolute -inset-4 rounded-3xl blur-2xl -z-10 opacity-70 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${specimen.accentColor}25 0%, #18A99915 50%, transparent 70%)`,
        }}
      />

      {/* Main Clinical Scanner HUD Card */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-[#E2EAF1] shadow-xl shadow-[#12304A]/08 p-5 sm:p-6 space-y-4">
        {/* Top Status Header */}
        <div className="flex items-center justify-between border-b border-[#E2EAF1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
              <ScanLine className="w-4 h-4 animate-pulse text-[#1769E0]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#16865B] ring-2 ring-white animate-ping" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172B3A] tracking-wider uppercase flex items-center gap-1.5">
                <span>Active Vision Inspection</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-[#16865B] border border-emerald-200 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16865B] animate-pulse" />
                  ONLINE
                </span>
              </div>
              <div className="text-[11px] text-[#647789] flex items-center gap-1.5 font-mono">
                <span className="text-emerald-600 font-bold tabular-nums">{latencyMs}ms</span>
                <span>·</span>
                <span className="tabular-nums">{fps} FPS</span>
                <span>·</span>
                <span>Dual-Pass OCR Grounding</span>
              </div>
            </div>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                showBoundingBoxes
                  ? 'bg-[#EAF3FF] text-[#1769E0] border-[#1769E0]/30'
                  : 'bg-white text-slate-400 border-[#E2EAF1]'
              }`}
              title={showBoundingBoxes ? 'Hide OCR Targets' : 'Show OCR Targets'}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSimulateRescan}
              className="p-1.5 rounded-lg border border-[#E2EAF1] hover:bg-[#F6FAFD] text-[#647789] hover:text-[#172B3A] transition-colors"
              title="Re-run Scanner"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Specimen Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F6FAFD] rounded-xl border border-[#E2EAF1] overflow-x-auto">
          {DEMO_SPECIMENS.map((item, idx) => {
            const isActive = idx === selectedIdx;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  handleSimulateRescan();
                }}
                className={`flex-1 min-w-[100px] py-1.5 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap text-center ${
                  isActive
                    ? 'bg-white text-[#172B3A] shadow-xs border border-[#E2EAF1]'
                    : 'text-[#647789] hover:text-[#172B3A]'
                }`}
              >
                {item.brandName.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* AR / HUD Medicine Packaging Viewfinder */}
        <div className="relative rounded-xl overflow-hidden border border-[#E2EAF1] bg-gradient-to-b from-[#F6FAFD] via-white to-[#F6FAFD] p-4 min-h-[220px]">
          {/* Laser Scanning Line */}
          {isScanning && <div key={scanPulse} className="scanner-laser" />}

          {/* AR Target Reticle Corners with Real-Time Telemetry Coordinates */}
          <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
            <div className="w-3 h-3 border-t-2 border-l-2 border-[#1769E0] rounded-tl-sm" />
            <span className="text-[9px] font-mono text-[#1769E0] font-semibold bg-white/80 px-1 py-0.2 rounded border border-[#1769E0]/20 backdrop-blur-xs tabular-nums">
              ROI: [{roiCoords.x}, {roiCoords.y}]
            </span>
          </div>

          <div className="absolute top-2 right-2 flex items-center gap-1 pointer-events-none">
            <span className="text-[9px] font-mono text-emerald-700 font-semibold bg-emerald-50/90 px-1.5 py-0.2 rounded border border-emerald-200 backdrop-blur-xs tabular-nums">
              CONF: {currentConfidence}%
            </span>
            <div className="w-3 h-3 border-t-2 border-r-2 border-[#1769E0] rounded-tr-sm" />
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-1 pointer-events-none">
            <div className="w-3 h-3 border-b-2 border-l-2 border-[#1769E0] rounded-bl-sm" />
            <span className="text-[9px] font-mono text-slate-500 bg-white/80 px-1 py-0.2 rounded border border-slate-200 backdrop-blur-xs tabular-nums">
              SIM: {cosineSimilarity}
            </span>
          </div>

          <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none">
            <span className="text-[9px] font-mono text-[#1769E0] bg-white/80 px-1 py-0.2 rounded border border-[#1769E0]/20 backdrop-blur-xs tabular-nums">
              FEAT: {(vectorTokens % 2000 + 1200)} pts
            </span>
            <div className="w-3 h-3 border-b-2 border-r-2 border-[#1769E0] rounded-br-sm" />
          </div>

          {/* Realistic Medicine Strip Blister */}
          <div className="bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 relative overflow-hidden mt-3 mb-3">
            
            {/* Header: Brand Name + Strength + Schedule */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="relative inline-block">
                  <span className="font-display font-bold text-base text-[#172B3A] tracking-tight">
                    {specimen.brandName}
                  </span>

                  {/* OCR Bounding Box for Brand Name with Live Floating Confidence */}
                  {showBoundingBoxes && (
                    <span className="absolute -inset-1 border border-dashed border-[#1769E0] rounded bg-[#1769E0]/10 pointer-events-none flex items-center justify-end">
                      <span className="absolute -top-3 right-0 text-[8px] font-mono font-bold bg-[#1769E0] text-white px-1 py-0.2 rounded tabular-nums">
                        BRAND {brandConfidence}%
                      </span>
                    </span>
                  )}
                </div>

                <div className="relative inline-block">
                  <div className="text-[11px] text-[#647789] font-medium">
                    {specimen.genericName}
                  </div>

                  {/* OCR Bounding Box for Generic Salt Composition with Live Floating Confidence */}
                  {showBoundingBoxes && (
                    <span className="absolute -inset-0.5 border border-dashed border-[#18A999] rounded bg-[#18A999]/10 pointer-events-none flex items-center justify-end">
                      <span className="absolute -top-2.5 right-0 text-[8px] font-mono font-bold bg-[#18A999] text-white px-1 py-0.2 rounded tabular-nums">
                        SALT {saltConfidence}%
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Prescription Rule Stamp */}
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono shrink-0 border ${
                  specimen.schedule === 'Schedule H1'
                    ? 'bg-red-50 text-[#C84747] border-red-200'
                    : specimen.schedule === 'Schedule H'
                    ? 'bg-amber-50 text-[#C78319] border-amber-200'
                    : 'bg-teal-50 text-[#16865B] border-teal-200'
                }`}
              >
                {specimen.schedule === 'OTC' ? 'OTC Medicine' : `${specimen.schedule} (Rx)`}
              </span>
            </div>

            {/* Manufacturer & Batch / Expiry Footer */}
            <div className="flex flex-wrap items-center justify-between text-[10px] text-[#647789] pt-1.5 border-t border-slate-200/70 font-mono">
              <span className="truncate max-w-[180px]">{specimen.manufacturer}</span>
              <div className="flex items-center gap-2">
                <span>B.No: {specimen.batchNumber}</span>
                <span>·</span>
                <span>EXP: {specimen.expiryDate}</span>
              </div>
            </div>
          </div>

          {/* Real-Time Live Extraction Telemetry Bar */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-[#18A999]/30 text-[#172B3A] shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#18A999]" />
              <span className="font-semibold text-[11px]">Active Formulation:</span>
              <span className="font-mono text-[11px] font-bold text-[#1769E0]">
                {specimen.activeSalts[0]}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-white border border-[#E2EAF1] text-[#647789] shadow-xs">
              <span className="font-medium text-[11px]">Class:</span>
              <span className="text-[#172B3A] font-semibold text-[11px]">
                {specimen.therapeuticClass.split('/')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Live Neural Processing Telemetry Dashboard */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] border border-slate-800 shadow-inner">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#18A999]" />
              Latency
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-400 tabular-nums">{latencyMs} ms</span>
              <span className="text-[9px] text-slate-500 tabular-nums">· {fps} fps</span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#1769E0]" />
              Vector Inferences
            </span>
            <span className="font-bold text-sky-400 tabular-nums">
              {vectorTokens.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col gap-0.5 items-end">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <span>Neural Pulse</span>
            </span>
            <div className="flex items-end gap-1 h-4 pt-1">
              {neuralBars.map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-[#1769E0] to-[#18A999] transition-all duration-200"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Grounding & Confidence Telemetry Bar */}
        <div className="flex items-center justify-between text-xs text-[#647789] bg-[#F6FAFD] rounded-xl p-3 border border-[#E2EAF1]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#18A999] animate-pulse" />
            <span className="font-semibold text-[#172B3A]">20,400+ Indian Medicine DB</span>
          </div>
          <span className="text-[11px] text-[#1769E0] font-mono font-bold flex items-center gap-1 tabular-nums">
            <Zap className="w-3 h-3 text-[#1769E0]" />
            Grounding Match: {currentConfidence}%
          </span>
        </div>
      </div>

      {/* Floating Accent Badge: Hindi Clinical Safety Education */}
      <div className="absolute -bottom-3 -left-2 sm:-left-4 bg-white border border-[#E2EAF1] rounded-xl px-3.5 py-2.5 shadow-lg shadow-[#12304A]/08 flex items-center gap-2.5 max-w-[280px]">
        <div className="w-7 h-7 rounded-lg bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center font-bold text-xs shrink-0">
          अ
        </div>
        <div className="text-left truncate">
          <div className="text-xs font-bold text-[#172B3A] truncate">
            {specimen.brandName}
          </div>
          <div className="text-[10px] text-[#647789] truncate hindi-text">
            {specimen.hindiSummary}
          </div>
        </div>
      </div>

      {/* Floating Accent Badge: Top-Right Precision Score with Live Animated Ping */}
      <div className="absolute -top-3 -right-2 sm:-right-4 bg-white border border-[#E2EAF1] rounded-xl px-3 py-1.5 shadow-lg shadow-[#12304A]/08 flex items-center gap-1.5 font-mono">
        <span className="w-2 h-2 rounded-full bg-[#16865B] animate-ping" />
        <span className="text-xs font-bold text-[#172B3A] tabular-nums">
          AI Precision: {currentConfidence}%
        </span>
      </div>
    </div>
  );
};
