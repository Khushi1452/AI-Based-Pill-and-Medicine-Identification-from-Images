import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  Trash2,
  SlidersHorizontal,
  FlaskConical,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type {
  CalibrationRule,
  BenchmarkSuiteReport,
  BenchmarkCaseResult,
} from '../types/medicine';

interface AccuracyTrainerLabProps {
  onTestCalibrationRule: (rule: CalibrationRule) => void;
}

export const AccuracyTrainerLab: React.FC<AccuracyTrainerLabProps> = ({
  onTestCalibrationRule,
}) => {
  const [calibrations, setCalibrations] = useState<CalibrationRule[]>([]);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkSuiteReport | null>(null);
  const [runningBenchmark, setRunningBenchmark] = useState<boolean>(false);
  const [selectedCase, setSelectedCase] = useState<BenchmarkCaseResult | null>(null);

  // New Calibration Rule Form State
  const [brandPattern, setBrandPattern] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [activeSaltsInput, setActiveSaltsInput] = useState('');
  const [therapeuticClass, setTherapeuticClass] = useState(
    'Anti-Diabetic & Blood Glucose Regulator (मधुमेह / ब्लड शुगर नियंत्रण दवा)'
  );
  const [isPrescriptionRequired, setIsPrescriptionRequired] = useState(true);
  const [hindiNote, setHindiNote] = useState('');
  const [savingRule, setSavingRule] = useState(false);

  const fetchCalibrations = async () => {
    try {
      const res = await fetch('/api/calibration');
      if (res.ok) {
        const data = await res.json();
        setCalibrations(data.calibrations || []);
      }
    } catch {
      // Ignore error
    }
  };

  useEffect(() => {
    fetchCalibrations();
  }, []);

  const handleRunBenchmark = async () => {
    setRunningBenchmark(true);
    try {
      const res = await fetch('/api/benchmark/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const report: BenchmarkSuiteReport = await res.json();
        setBenchmarkReport(report);
        if (report.results.length > 0) {
          setSelectedCase(report.results[0]);
        }
      }
    } finally {
      setRunningBenchmark(false);
    }
  };

  const handleAddCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandPattern.trim() || !strength.trim() || !activeSaltsInput.trim()) return;
    setSavingRule(true);
    try {
      const res = await fetch('/api/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandPattern: brandPattern.trim(),
          dosageForm: dosageForm.trim(),
          strength: strength.trim(),
          activeSalts: activeSaltsInput
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          therapeuticClass: therapeuticClass.trim(),
          isPrescriptionRequired,
          hindiNote: hindiNote.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalibrations(data.calibrations || []);
        setBrandPattern('');
        setStrength('');
        setActiveSaltsInput('');
        setHindiNote('');
      }
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteCalibration = async (id: string) => {
    try {
      const res = await fetch(`/api/calibration/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setCalibrations(data.calibrations || []);
      }
    } catch {
      // Ignore
    }
  };

  return (
    <section
      id="accuracy-lab"
      className="bg-white border border-[#E2EAF1] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-[#E2EAF1] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-b from-[#F6FAFD]/80 via-white to-white">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-pulse" />
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Accuracy Verification &amp; Calibration Suite</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B3A] tracking-tight">
            Indian Medicine Model Calibration &amp; Benchmark Lab
          </h2>
          <p className="text-xs sm:text-sm text-[#647789] leading-relaxed">
            Verify automated end-to-end recognition accuracy against our 6-point benchmark suite and ground custom Indian medicine rules in persistent server memory.
          </p>
        </div>

        <button
          type="button"
          disabled={runningBenchmark}
          onClick={handleRunBenchmark}
          className="px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-[#1769E0] to-[#1255B8] hover:from-[#1255B8] hover:to-[#0D4194] disabled:from-slate-300 disabled:to-slate-400 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center justify-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <Play className={`w-3.5 h-3.5 ${runningBenchmark ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
          <span>
            {runningBenchmark
              ? 'Executing 6-Point Benchmark Suite...'
              : 'Run Accuracy Benchmark Suite'}
          </span>
        </button>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* PART 1: AUTOMATED BENCHMARK RESULTS */}
        {benchmarkReport && (
          <div className="space-y-6 pb-8 border-b border-[#E2EAF1]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#16865B] flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172B3A]">
                    Automated Verification Suite Results
                  </h3>
                  <div className="text-xs text-[#647789]">
                    Verified against Indian Pharmacopoeia standard clinical rules
                  </div>
                </div>
              </div>

              {/* Benchmark Summary Metrics */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3 text-xs font-mono tabular-nums">
                <div className="px-3.5 py-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#647789]">Accuracy</div>
                  <div className="text-base font-extrabold text-[#16865B]">{benchmarkReport.accuracyPercent}%</div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#647789]">Passed</div>
                  <div className="text-base font-extrabold text-[#172B3A]">{benchmarkReport.passedCases}/{benchmarkReport.totalCases}</div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] text-center">
                  <div className="text-[10px] uppercase font-bold text-[#647789]">Time</div>
                  <div className="text-xs font-bold text-[#647789] mt-1">{new Date(benchmarkReport.timestamp).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Table of Benchmark Cases (7 cols) */}
              <div className="lg:col-span-7 border border-[#E2EAF1] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F6FAFD] border-b border-[#E2EAF1] text-[11px] font-bold text-[#647789] uppercase tracking-wider">
                      <th className="py-3 px-4">Case ID</th>
                      <th className="py-3 px-4">Test Specimen</th>
                      <th className="py-3 px-4">Identification</th>
                      <th className="py-3 px-4 text-right">Confidence</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EAF1] text-xs">
                    {benchmarkReport.results.map((r) => {
                      const isSelected = selectedCase?.caseId === r.caseId;
                      return (
                        <tr
                          key={r.caseId}
                          onClick={() => setSelectedCase(r)}
                          className={`cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#EAF3FF] border-l-4 border-l-[#1769E0]'
                              : 'hover:bg-[#F6FAFD]'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-[#172B3A]">
                            {r.caseId}
                          </td>
                          <td className="py-3 px-4 font-medium text-[#172B3A]">{r.name}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#647789]">
                            id:{String(r.actualIdentified)} · rx:{String(r.actualRx)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[#172B3A]">
                            {(r.confidenceScore * 100).toFixed(0)}%
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            {r.passed ? (
                              <span className="inline-flex items-center gap-1 text-[#16865B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                                <CheckCircle2 className="w-3 h-3" />
                                PASS
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[#C78319] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-[11px]">
                                CHECK
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Selected Benchmark Case JSON Inspector (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                {selectedCase && (
                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 text-slate-100 shadow-md">
                    {/* macOS Terminal Window Titlebar */}
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                        <span className="text-slate-300 font-semibold ml-2">
                          {selectedCase.caseId} output.json
                        </span>
                      </div>
                      <span className="tabular-nums text-[11px] text-emerald-400 font-mono">
                        {selectedCase.latencyMs}ms latency
                      </span>
                    </div>
                    <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[280px] text-emerald-400 scrollbar-none">
                      {JSON.stringify(selectedCase.outputJson, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PART 2: FEW-SHOT CALIBRATION TRAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add New Calibration Rule Form (5 cols) */}
          <form
            onSubmit={handleAddCalibration}
            className="lg:col-span-5 space-y-4 bg-gradient-to-br from-[#F6FAFD] to-white p-6 sm:p-7 rounded-3xl border border-[#E2EAF1] shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B3A]">
                  Train Custom Medicine Calibration Rule
                </h3>
                <p className="text-[11px] text-[#647789]">
                  Ground verified Indian formulations into persistent memory
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B3A]">
                  Brand / Label Pattern *
                </label>
                <input
                  type="text"
                  required
                  value={brandPattern}
                  onChange={(e) => setBrandPattern(e.target.value)}
                  placeholder="e.g., Montair LC Tablet or Shelcal 500"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-slate-400 focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172B3A]">Dosage Form *</label>
                <select
                  value={dosageForm}
                  onChange={(e) => setDosageForm(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2EAF1] rounded-xl text-[#172B3A] focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
                >
                  <option value="Tablet">Tablet</option>
                  <option value="Capsule">Capsule</option>
                  <option value="Syrup">Syrup</option>
                  <option value="Cream">Cream</option>
                  <option value="Gel">Gel</option>
                  <option value="Injection">Injection</option>
                  <option value="Inhaler">Inhaler</option>
                  <option value="Rotacap">Rotacap</option>
                  <option value="Eye Drops">Eye Drops</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#172B3A]">
                  Exact Strength &amp; Units *
                </label>
                <input
                  type="text"
                  required
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="e.g., 10 mg / 5 mg"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-slate-400 focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B3A]">
                  Verified Active Salts (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={activeSaltsInput}
                  onChange={(e) => setActiveSaltsInput(e.target.value)}
                  placeholder="e.g., Montelukast Sodium (10 mg), Levocetirizine (5 mg)"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-slate-400 focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B3A]">
                  Therapeutic Category (English &amp; Hindi)
                </label>
                <input
                  type="text"
                  value={therapeuticClass}
                  onChange={(e) => setTherapeuticClass(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-slate-400 focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-xs font-semibold text-[#172B3A]">
                  Hindi Clinical Indication Note (देवनागरी नोट)
                </label>
                <input
                  type="text"
                  value={hindiNote}
                  onChange={(e) => setHindiNote(e.target.value)}
                  placeholder="e.g., एलर्जी के लक्षणों जैसे छींक और नाक बहने से राहत हेतु उपयोगी।"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-slate-400 focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
                />
              </div>

              <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2.5 text-xs font-medium text-[#172B3A] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrescriptionRequired}
                    onChange={(e) => setIsPrescriptionRequired(e.target.checked)}
                    className="w-4 h-4 rounded-md border-slate-300 text-[#1769E0] focus:ring-[#1769E0]"
                  />
                  <span>Prescription Required (Schedule H)</span>
                </label>

                <button
                  type="submit"
                  disabled={savingRule}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#172B3A] hover:bg-[#12304A] rounded-xl transition-all shadow-xs hover:shadow-sm active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{savingRule ? 'Saving...' : 'Save Rule'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Active Calibration Memory Table (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#172B3A]">
                  Active Grounded Calibration Rules ({calibrations.length})
                </h3>
                <p className="text-[11px] text-[#647789]">Stored persistently in calibration_store.json</p>
              </div>
            </div>

            <div className="border border-[#E2EAF1] rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#E2EAF1] z-10">
                  <tr className="text-[11px] font-bold text-[#647789] uppercase tracking-wider">
                    <th className="py-3 px-4">Brand Pattern</th>
                    <th className="py-3 px-4">Form &amp; Strength</th>
                    <th className="py-3 px-4">Verified Active Salts</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EAF1] text-xs">
                  {calibrations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 px-4 text-center text-slate-400">
                        No custom calibration rules defined yet. Add your first rule on the left.
                      </td>
                    </tr>
                  ) : (
                    calibrations.map((rule) => (
                      <tr key={rule.id} className="hover:bg-[#F6FAFD] transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#172B3A]">
                          {rule.brandPattern}
                        </td>
                        <td className="py-3.5 px-4 font-mono tabular-nums text-[#647789] whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-[#F6FAFD] border border-[#E2EAF1] text-[11px]">
                            {rule.dosageForm} · {rule.strength}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#172B3A]">
                          <div className="flex flex-wrap gap-1">
                            {rule.activeSalts.map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#1769E0] font-mono text-[11px] font-medium border border-[#1769E0]/15"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onTestCalibrationRule(rule)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#1769E0] bg-[#EAF3FF] hover:bg-[#1769E0] hover:text-white rounded-lg transition-colors shadow-2xs"
                            >
                              <span>Test</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCalibration(rule.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete calibration rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
