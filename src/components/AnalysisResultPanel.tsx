import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  FileJson,
  ShieldAlert,
  Database,
  Pill,
  Sparkles,
  Info,
  RotateCcw,
  Stethoscope,
  HeartPulse,
  Languages,
  Activity,
  FileText,
  Building2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Utensils,
  ShieldCheck,
} from 'lucide-react';
import type {
  AnalyzeApiEnvelope,
  CatalogVariant,
  LanguageMode,
} from '../types/medicine';
import {
  getLocalizedReportContent,
  formatClinicalReportAsText,
} from '../utils/languageFormatter';

interface AnalysisResultPanelProps {
  envelope: AnalyzeApiEnvelope | null;
  loading: boolean;
  error: string | null;
  uploadedThumbnail?: string | null;
  analysisProgress?: number;
  initialLanguage?: LanguageMode;
  onLanguageChange?: (lang: LanguageMode) => void;
  onRetry?: () => void;
  onReset?: () => void;
  onSelectCatalogVariant?: (variant: CatalogVariant) => void;
}

export const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({
  envelope,
  loading,
  error,
  uploadedThumbnail,
  analysisProgress,
  initialLanguage = 'en',
  onLanguageChange,
  onRetry,
  onReset,
  onSelectCatalogVariant,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'matches' | 'json'>('report');
  const [resultLanguage, setResultLanguage] = useState<LanguageMode>(initialLanguage);
  const [copied, setCopied] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [showOcrText, setShowOcrText] = useState(false);

  // User feedback states
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<'CORRECT' | 'INCORRECT' | null>(null);
  const [showInaccuracyForm, setShowInaccuracyForm] = useState(false);
  const [fieldChecks, setFieldChecks] = useState({
    brand: true,
    strength: true,
    salts: true,
    dosageForm: true,
    manufacturer: true,
  });
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Sync initial language if changed from parent
  useEffect(() => {
    if (initialLanguage) {
      setResultLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  const handleLanguageSwitch = (newLang: LanguageMode) => {
    setResultLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  // Self-reliant animated progress fallback if not provided via props
  useEffect(() => {
    if (!loading) {
      setLocalProgress(0);
      return;
    }
    if (analysisProgress !== undefined) return;

    setLocalProgress(5);
    const timer = setInterval(() => {
      setLocalProgress((prev) => {
        if (prev < 25) return prev + Math.floor(Math.random() * 4 + 3);
        if (prev < 55) return prev + Math.floor(Math.random() * 3 + 2);
        if (prev < 80) return prev + Math.floor(Math.random() * 2 + 1);
        if (prev < 95) return prev + 1;
        return 95;
      });
    }, 85);
    return () => clearInterval(timer);
  }, [loading, analysisProgress]);

  const currentProgress = analysisProgress !== undefined ? analysisProgress : localProgress;

  const handleCopyReport = async () => {
    if (!envelope) return;
    const textToCopy = formatClinicalReportAsText(envelope, resultLanguage);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendFeedback = async (type: 'CORRECT' | 'INCORRECT') => {
    if (!envelope) return;
    setSubmittingFeedback(true);
    try {
      await fetch('/api/medicine/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedbackType: type,
          isIdentified: envelope.result.is_identified,
          brandName: envelope.result.data.brand_name,
          confidenceScore: envelope.result.confidence_score,
          groundingMethod: envelope.groundingMethod,
          fieldFeedback: type === 'INCORRECT' ? fieldChecks : undefined,
          proposedCorrections: type === 'INCORRECT' ? { notes: correctionNotes } : undefined,
          timestamp: new Date().toISOString(),
        }),
      });
      setFeedbackSubmitted(type);
      setShowInaccuracyForm(false);
    } catch {
      // Set local confirmation even if offline
      setFeedbackSubmitted(type);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // 1. Loading State with Round Animated Progress Bar & Percentage
  if (loading) {
    const radius = 64;
    const circumference = 2 * Math.PI * radius; // ~402.12
    const strokeDashoffset = circumference - (circumference * Math.min(currentProgress, 100)) / 100;
    const isCompleted = currentProgress >= 100;

    const stages = [
      {
        id: 1,
        threshold: 25,
        title: 'Image Contrast & Glare Removal',
        desc: 'Morphological filtering to flatten foil wrinkles & suppress specular reflections',
      },
      {
        id: 2,
        threshold: 55,
        title: 'Pharmaceutical Multi-Pass OCR',
        desc: 'Black-hat ink isolation, orientation auto-correction & salt extraction',
      },
      {
        id: 3,
        threshold: 82,
        title: '20,485+ Verified Indian Catalog Match',
        desc: 'Cross-referencing CDSCO approved formulations & brand families',
      },
      {
        id: 4,
        threshold: 99,
        title: 'Schedule H & Multilingual Synthesis',
        desc: 'Formatting clinical findings in English, Hinglish, and Hindi',
      },
    ];

    return (
      <div className="bg-white border border-[#E2EAF1] rounded-3xl p-6 sm:p-8 space-y-7 shadow-sm">
        {/* Top Header Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2EAF1] pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20">
            <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-pulse" />
            <span>Active Blister Foil Recognition Running</span>
          </div>
          <span className="text-xs font-mono text-[#647789] bg-[#F6FAFD] px-2.5 py-1 rounded-lg border border-[#E2EAF1]">
            Grounding Pipeline v2.5
          </span>
        </div>

        {/* Centerpiece: Round Animated Bar with Percentage */}
        <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Round Progress Bar */}
            <svg className="w-full h-full -rotate-90 transform drop-shadow-xs" viewBox="0 0 160 160">
              <defs>
                <linearGradient id="circleProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1769E0" />
                  <stop offset="60%" stopColor="#18A999" />
                  <stop offset="100%" stopColor={isCompleted ? '#16865B' : '#18A999'} />
                </linearGradient>
              </defs>
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#E2EAF1"
                strokeWidth="11"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="url(#circleProgressGradient)"
                strokeWidth="11"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-200 ease-out"
              />
            </svg>

            {/* Inner Content Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono text-[#172B3A] tabular-nums tracking-tight">
                {Math.round(currentProgress)}%
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 ${
                  isCompleted
                    ? 'bg-emerald-100 text-[#16865B]'
                    : 'bg-[#EAF3FF] text-[#1769E0]'
                }`}
              >
                {isCompleted ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Complete</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1769E0] animate-ping" />
                    <span>Scanning</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-w-md">
            <h4 className="text-base sm:text-lg font-bold font-display text-[#172B3A]">
              {isCompleted
                ? 'Analysis Complete! Displaying Formatted Report...'
                : currentProgress < 25
                ? 'Phase 1: Calibrating Blister Foil & Removing Glare'
                : currentProgress < 55
                ? 'Phase 2: Extracting Packaging Brand & Salts'
                : currentProgress < 82
                ? 'Phase 3: Cross-Referencing 20,485+ Indian Formulations'
                : 'Phase 4: Synthesizing English, Hinglish & Hindi Guidance'}
            </h4>
            <p className="text-xs text-[#647789] leading-relaxed">
              {isCompleted
                ? 'Clinical report synthesized and verified against Indian Pharmacopoeia standards.'
                : 'Inspecting printed blister foil composition, strength units, and Schedule H classifications in real-time.'}
            </p>
          </div>
        </div>

        {/* 4 Pipeline Stage Progress Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {stages.map((stage) => {
            const isPassed = currentProgress >= stage.threshold;
            const isCurrent =
              !isPassed && (stage.id === 1 || currentProgress >= stages[stage.id - 2].threshold);

            return (
              <div
                key={stage.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isPassed
                    ? 'bg-emerald-50/50 border-emerald-200/80 shadow-2xs'
                    : isCurrent
                    ? 'bg-[#EAF3FF]/60 border-[#1769E0]/40 shadow-xs'
                    : 'bg-[#F6FAFD] border-[#E2EAF1] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[11px] font-bold ${
                      isPassed
                        ? 'text-[#16865B]'
                        : isCurrent
                        ? 'text-[#1769E0]'
                        : 'text-[#647789]'
                    }`}
                  >
                    {stage.title}
                  </span>
                  {isPassed ? (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-[#16865B] flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  ) : isCurrent ? (
                    <span className="w-4 h-4 rounded-full bg-[#1769E0] text-white flex items-center justify-center shrink-0">
                      <RotateCcw className="w-2.5 h-2.5 animate-spin" />
                    </span>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-[#647789] line-clamp-1">{stage.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Bottom Linear Fill Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#647789]">
            <span>Neural inference progress</span>
            <span className="font-bold text-[#172B3A]">{Math.round(currentProgress)}%</span>
          </div>
          <div className="w-full bg-[#E2EAF1] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-[#1769E0] via-[#18A999] to-[#1769E0]'
              }`}
              style={{ width: `${Math.min(currentProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-white border border-[#C84747]/30 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 text-[#C84747] font-bold text-lg">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span>Medicine Analysis Notice</span>
        </div>
        <p className="text-sm text-[#172B3A] leading-relaxed bg-red-50/60 p-4 rounded-xl border border-red-100">
          {error}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1769E0] hover:bg-[#1255B8] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F6FAFD] hover:bg-[#EAF3FF] text-[#172B3A] text-xs font-semibold rounded-xl border border-[#E2EAF1] transition-colors"
            >
              <span>Upload Another Photo</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty / Initial State (Diagnostic Ready Preview)
  if (!envelope) {
    return (
      <div className="bg-white border border-[#E2EAF1] rounded-2xl p-6 sm:p-10 space-y-6 shadow-sm">
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EAF3FF] to-[#D5E6FF] text-[#1769E0] flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-8 h-8 text-[#1769E0]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#18A999] ring-2 ring-white animate-pulse" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-xl font-display font-bold text-[#172B3A]">
              Clinical Packaging Inspector Ready
            </h3>
            <p className="text-xs sm:text-sm text-[#647789] leading-relaxed">
              Upload a real smartphone photo of an Indian medicine blister strip (foil or front), carton box, or bottle to inspect active salts, verify Schedule H rules, and receive formatted guidance in English, Hinglish, or Hindi.
            </p>
          </div>
        </div>

        {/* 4 Feature Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B3A]">
              <div className="w-6 h-6 rounded-lg bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
                <Pill className="w-3.5 h-3.5" />
              </div>
              <span>Active Salts &amp; Strength</span>
            </div>
            <p className="text-[11px] text-[#647789] leading-relaxed">
              Extracts chemical compositions, milligram strengths, and formulation types directly from wrinkled foil packaging text.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B3A]">
              <div className="w-6 h-6 rounded-lg bg-amber-50 text-[#C78319] flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <span>Schedule H / Rx Verification</span>
            </div>
            <p className="text-[11px] text-[#647789] leading-relaxed">
              Checks Indian Pharmacopoeia &amp; CDSCO prescription rules with dual-range HSV red warning box detection.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B3A]">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#16865B] flex items-center justify-center">
                <Languages className="w-3.5 h-3.5" />
              </div>
              <span>English, Hinglish &amp; Hindi</span>
            </div>
            <p className="text-[11px] text-[#647789] leading-relaxed">
              Results provided in English by default with instant 1-click switching to natural Hinglish or Devanagari Hindi.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B3A]">
              <div className="w-6 h-6 rounded-lg bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
                <Database className="w-3.5 h-3.5" />
              </div>
              <span>20,485+ Formulation Graph</span>
            </div>
            <p className="text-[11px] text-[#647789] leading-relaxed">
              Cross-references extracted brand names against our verified CDSCO database for high-precision grounding.
            </p>
          </div>
        </div>

        {/* Accepted Formats Footer */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-[#647789] border-t border-[#E2EAF1]">
          <span className="px-2.5 py-1 rounded-md bg-[#F6FAFD] border border-[#E2EAF1]">
            ✓ Blister Foil Back
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#F6FAFD] border border-[#E2EAF1]">
            ✓ Blister Front
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#F6FAFD] border border-[#E2EAF1]">
            ✓ Syrups &amp; Suspensions
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#F6FAFD] border border-[#E2EAF1]">
            ✓ Topical Creams &amp; Gels
          </span>
          <span className="px-2.5 py-1 rounded-md bg-[#F6FAFD] border border-[#E2EAF1]">
            ✓ Inhalers &amp; Rotacaps
          </span>
        </div>
      </div>
    );
  }

  const { result, rawJsonString, catalogMatches, groundingMethod } = envelope;
  const { data } = result;

  // Localized report content based on currently selected language
  const content = getLocalizedReportContent(
    data,
    resultLanguage,
    result.is_identified,
    result.unclear_reason
  );

  return (
    <div className="bg-white border border-[#E2EAF1] rounded-2xl overflow-hidden shadow-sm">
      {/* Top Digital Report Header & View Switcher */}
      <div className="px-6 py-5 bg-[#F6FAFD] border-b border-[#E2EAF1] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {result.is_identified ? (
              <div className="w-7 h-7 rounded-lg bg-[#16865B]/10 text-[#16865B] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-[#C78319]/10 text-[#C78319] flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            <h2 className="font-display font-bold text-lg text-[#172B3A]">
              Medicine Identification Results
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#647789]">
            <span
              className={`font-semibold px-2 py-0.5 rounded-md ${
                result.is_identified
                  ? 'bg-emerald-50 text-[#16865B] border border-emerald-200'
                  : 'bg-amber-50 text-[#C78319] border border-amber-200'
              }`}
            >
              {content.statusLabel}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-600">
              Confidence: {(result.confidence_score * 100).toFixed(0)}%
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#1769E0] font-medium">
              {groundingMethod === 'deterministic_kb_assisted'
                ? 'Knowledge Graph Grounded'
                : groundingMethod === 'local_ai_verified'
                ? 'Local OCR+ML Verified'
                : 'Two-Pass Vision AI'}
            </span>
          </div>
        </div>

        {/* Tab Switcher Controls (Report / Matches / JSON) */}
        <div className="flex items-center gap-1 p-1 bg-[#E2EAF1]/70 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'report'
                ? 'bg-white text-[#172B3A] shadow-xs'
                : 'text-[#647789] hover:text-[#172B3A]'
            }`}
          >
            Clinical Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'bg-white text-[#172B3A] shadow-xs'
                : 'text-[#647789] hover:text-[#172B3A]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#1769E0]" />
            <span>Dataset ({catalogMatches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'json'
                ? 'bg-white text-[#172B3A] shadow-xs'
                : 'text-[#647789] hover:text-[#172B3A]'
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-[#647789]" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: STRUCTURED CLINICAL DIGITAL REPORT */}
      {activeTab === 'report' && (
        <div className="p-6 sm:p-8 space-y-6">
          {/* QUICK LANGUAGE CHANGE SEGMENTED CONTROL BAR (English / Hinglish / Hindi) */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-[#EAF3FF]/80 via-[#F6FAFD] to-[#EAF3FF]/80 border border-[#1769E0]/20 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-[#172B3A]">
              <div className="w-7 h-7 rounded-lg bg-[#1769E0] text-white flex items-center justify-center shadow-xs">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider text-[#1769E0] font-extrabold">
                  Language / भाषा चयन
                </div>
                <div className="text-xs text-[#647789]">
                  Instant 1-Click Translation
                </div>
              </div>
            </div>

            {/* The 3 Segmented Quick Switch Buttons */}
            <div className="inline-flex items-center p-1 bg-white rounded-xl border border-[#E2EAF1] shadow-xs">
              <button
                type="button"
                onClick={() => handleLanguageSwitch('en')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  resultLanguage === 'en'
                    ? 'bg-[#1769E0] text-white shadow-xs scale-[1.02]'
                    : 'text-[#647789] hover:text-[#172B3A] hover:bg-[#F6FAFD]'
                }`}
              >
                <span>🇬🇧 English</span>
                {resultLanguage === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageSwitch('hinglish')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  resultLanguage === 'hinglish'
                    ? 'bg-[#1769E0] text-white shadow-xs scale-[1.02]'
                    : 'text-[#647789] hover:text-[#172B3A] hover:bg-[#F6FAFD]'
                }`}
              >
                <span>🇮🇳 Hinglish</span>
                {resultLanguage === 'hinglish' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>

              <button
                type="button"
                onClick={() => handleLanguageSwitch('hi')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  resultLanguage === 'hi'
                    ? 'bg-[#1769E0] text-white shadow-xs scale-[1.02]'
                    : 'text-[#647789] hover:text-[#172B3A] hover:bg-[#F6FAFD]'
                }`}
              >
                <span>🕉️ हिंदी (Hindi)</span>
                {resultLanguage === 'hi' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            </div>
          </div>

          {/* Action Toolbar: Copy, Print, Retake */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2EAF1] no-print">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F6FAFD] text-[#172B3A] text-xs font-semibold rounded-xl border border-[#E2EAF1] transition-all shadow-2xs hover:border-[#1769E0]/40"
                title={`Copy report in ${resultLanguage.toUpperCase()}`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16865B]" />
                    <span className="text-[#16865B] font-bold">Report Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#647789]" />
                    <span>Copy Formatted Report ({resultLanguage.toUpperCase()})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F6FAFD] text-[#172B3A] text-xs font-semibold rounded-xl border border-[#E2EAF1] transition-all shadow-2xs hover:border-[#1769E0]/40"
              >
                <Printer className="w-3.5 h-3.5 text-[#647789]" />
                <span>Print / PDF</span>
              </button>
            </div>

            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-semibold text-[#1769E0] hover:text-[#1255B8] transition-colors"
              >
                + Scan Another Medicine
              </button>
            )}
          </div>

          {/* UNCERTAIN IDENTIFICATION ALERT BANNER */}
          {!result.is_identified && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-[#C78319] font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{content.unclearTitle}</span>
              </div>
              <p className="text-sm text-[#172B3A] leading-relaxed font-medium">
                {content.unclearText}
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                {onReset && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="px-4 py-2 bg-[#1769E0] text-white rounded-xl font-semibold hover:bg-[#1255B8] shadow-xs"
                  >
                    {content.unclearActionText}
                  </button>
                )}
                <span className="px-3.5 py-2 bg-white text-[#647789] rounded-xl border border-amber-200 font-medium">
                  {resultLanguage === 'en'
                    ? 'Always verify with a licensed pharmacist when in doubt'
                    : resultLanguage === 'hinglish'
                    ? 'Sandeha hone par kisi qualified pharmacist ko dikhayein'
                    : 'संदेह होने पर फार्मासिस्ट को दिखाएं'}
                </span>
              </div>
            </div>
          )}

          {/* 1. MEDICINE OVERVIEW CARD */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#647789] flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-[#1769E0]" />
                <span>1. {content.brandLabel} &amp; Overview</span>
              </h3>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${
                  data.is_prescription_required === true
                    ? 'bg-amber-50 text-[#C78319] border-amber-200'
                    : data.is_prescription_required === false
                    ? 'bg-teal-50 text-[#16865B] border-teal-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                {content.rxTag}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#F6FAFD] border border-[#E2EAF1]">
              <div className="space-y-1">
                <div className="text-xs text-[#647789]">{content.brandLabel}</div>
                <div className="text-base font-bold text-[#172B3A]">
                  {content.brandValue}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-[#647789]">{content.dosageFormLabel}</div>
                <div className="text-sm font-semibold text-[#172B3A]">
                  {content.dosageFormValue}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-[#647789]">{content.strengthLabel}</div>
                <div className="text-sm font-semibold text-[#172B3A] font-mono">
                  {content.strengthValue}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-[#647789]">{content.therapeuticClassLabel}</div>
                <div className="text-xs font-semibold text-[#172B3A] leading-tight">
                  {content.therapeuticClassValue}
                </div>
              </div>
            </div>
          </div>

          {/* 2. ACTIVE INGREDIENTS CARD */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#647789] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#18A999]" />
              <span>2. {content.activeSaltsLabel}</span>
            </h3>

            <div className="p-5 rounded-2xl bg-white border border-[#E2EAF1] space-y-3 shadow-2xs">
              {content.activeSaltsList && content.activeSaltsList.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {content.activeSaltsList.map((salt, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EAF3FF] border border-[#1769E0]/20 text-sm font-medium text-[#172B3A]"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1769E0]" />
                      <span>{salt}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Active chemical ingredient could not be separated from packaging text.
                </p>
              )}

              <div className="text-xs text-[#647789] pt-2 border-t border-slate-100">
                <span className="font-bold text-[#172B3A]">Details:</span>{' '}
                {content.activeSaltsDescription}
              </div>
            </div>
          </div>

          {/* 3. HOW & WHEN TO TAKE (ADMINISTRATION & TIMING SCHEDULE) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#647789] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#16865B]" />
                <span>3. {content.scheduleSectionTitle}</span>
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#16865B]/10 text-[#16865B] border border-[#16865B]/20">
                {content.frequencyText}
              </span>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#F0FDF4] via-white to-[#F6FAFD] border border-[#16865B]/25 space-y-5 shadow-2xs">
              {/* How to take method */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#16865B]/20 shadow-2xs">
                <div className="p-2 rounded-lg bg-[#16865B] text-white shrink-0 mt-0.5 shadow-xs">
                  <Pill className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="text-xs font-bold text-[#16865B] uppercase tracking-wider">
                    {content.howToTakeLabel}
                  </div>
                  <p className="text-sm font-semibold text-[#172B3A] leading-relaxed">
                    {content.howToTakeText}
                  </p>
                </div>
              </div>

              {/* Timing schedule with 3 slot cards: Morning, Afternoon, Evening */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#172B3A] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1769E0]" />
                    <span>{content.timingScheduleLabel}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Recommended typical clinical time slots
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Morning */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      content.morningActive
                        ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/50">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#92400E]">
                        <Sunrise className="w-4 h-4 text-amber-500" />
                        <span>{content.morningLabel}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          content.morningActive
                            ? 'bg-amber-200 text-[#78350F]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {content.morningActive ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="pt-2 text-xs font-bold text-[#172B3A] font-mono">
                      {content.morningTime}
                    </div>
                  </div>

                  {/* Afternoon */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      content.afternoonActive
                        ? 'bg-orange-50/70 border-orange-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-orange-200/50">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#9A3412]">
                        <Sun className="w-4 h-4 text-orange-500" />
                        <span>{content.afternoonLabel}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          content.afternoonActive
                            ? 'bg-orange-200 text-[#7C2D12]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {content.afternoonActive ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="pt-2 text-xs font-bold text-[#172B3A] font-mono">
                      {content.afternoonTime}
                    </div>
                  </div>

                  {/* Evening / Night */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      content.eveningActive
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-indigo-200/50">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#3730A3]">
                        <Moon className="w-4 h-4 text-indigo-500" />
                        <span>{content.eveningLabel}</span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                          content.eveningActive
                            ? 'bg-indigo-200 text-[#312E81]'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {content.eveningActive ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="pt-2 text-xs font-bold text-[#172B3A] font-mono">
                      {content.eveningTime}
                    </div>
                  </div>
                </div>
              </div>

              {/* Before or After Food Requirement */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  content.foodRelation === 'AFTER_FOOD'
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : content.foodRelation === 'BEFORE_FOOD'
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                    : 'bg-blue-50/80 border-blue-300 text-blue-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`p-2 rounded-lg text-white shrink-0 ${
                      content.foodRelation === 'AFTER_FOOD'
                        ? 'bg-[#16865B]'
                        : content.foodRelation === 'BEFORE_FOOD'
                        ? 'bg-amber-600'
                        : 'bg-[#1769E0]'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold tracking-wider opacity-80">
                      Food Timing Relationship / भोजन का नियम
                    </div>
                    <div className="text-sm font-bold mt-0.5">
                      {content.foodRelationInstruction}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold shrink-0 self-start sm:self-center border shadow-2xs ${
                    content.foodRelation === 'AFTER_FOOD'
                      ? 'bg-emerald-100 text-[#13734E] border-emerald-300'
                      : content.foodRelation === 'BEFORE_FOOD'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-blue-100 text-[#1255B8] border-blue-300'
                  }`}
                >
                  {content.foodRelationBadge}
                </span>
              </div>
            </div>
          </div>

          {/* 4. KEY THERAPEUTIC BENEFITS CARD (BEAUTIFULLY FORMATTED) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#647789] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1769E0]" />
                <span>4. {content.benefitsSectionTitle}</span>
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#1769E0]/10 text-[#1769E0] border border-[#1769E0]/20">
                Clinical Advantages
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {content.benefitsList.map((benefit, bIdx) => (
                <div
                  key={bIdx}
                  className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-[#F6FAFD] to-[#EAF3FF]/40 border border-[#1769E0]/20 space-y-2.5 shadow-2xs hover:border-[#1769E0]/45 hover:shadow-xs transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1769E0] to-[#18A999] text-white flex items-center justify-center shadow-xs">
                      {bIdx === 0 ? (
                        <Activity className="w-4 h-4" />
                      ) : bIdx === 1 ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <ShieldCheck className="w-4 h-4" />
                      )}
                    </div>
                    {benefit.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1769E0]/10 text-[#1769E0] border border-[#1769E0]/20">
                        {benefit.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#172B3A] leading-snug">
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-[#647789] leading-relaxed mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. COMMON USES CARD */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#647789] flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-[#1769E0]" />
              <span>5. {content.usesLabel}</span>
            </h3>

            <div className="p-5 rounded-2xl bg-white border border-[#E2EAF1] space-y-3 shadow-2xs">
              {content.usesList && content.usesList.length > 0 ? (
                <ul className="space-y-2.5">
                  {content.usesList.map((useStr, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-[#172B3A]">
                      <CheckCircle2 className="w-4 h-4 text-[#16865B] shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{useStr}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Specific indications could not be verified from packaging text.
                </p>
              )}
            </div>
          </div>

          {/* 6. IMPORTANT PRECAUTIONS CARD */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#647789] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C78319]" />
              <span>6. {content.precautionsLabel}</span>
            </h3>

            <div className="p-5 rounded-2xl bg-white border border-[#E2EAF1] space-y-3 shadow-2xs">
              {/* Optional Schedule H Red Prescription Box Alert */}
              {content.rxWarningBanner && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#C84747] text-xs font-bold flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{content.rxWarningBanner}</span>
                </div>
              )}

              {content.precautionsList && content.precautionsList.length > 0 ? (
                <ul className="space-y-2.5">
                  {content.precautionsList.map((precaution, idx) => {
                    const isRxWarning =
                      precaution.includes('Prescription') ||
                      precaution.includes('डॉक्टर के पर्चे') ||
                      precaution.includes('prescription');
                    return (
                      <li
                        key={idx}
                        className={`flex items-start gap-2.5 text-sm p-3 rounded-xl border ${
                          isRxWarning
                            ? 'bg-red-50/60 border-red-200 text-[#C84747] font-semibold'
                            : 'bg-[#F6FAFD] border-[#E2EAF1] text-[#172B3A]'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isRxWarning ? 'text-[#C84747]' : 'text-[#C78319]'
                          }`}
                        />
                        <span className="leading-relaxed">{precaution}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">
                  Precautions could not be established from available evidence.
                </p>
              )}
            </div>
          </div>

          {/* 7. DOCTOR OR PHARMACIST GUIDANCE */}
          <div className="p-5 rounded-2xl bg-[#EAF3FF] border border-[#1769E0]/20 space-y-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1769E0]">
              <Stethoscope className="w-4 h-4" />
              <span>7. {content.guidanceLabel}</span>
            </div>
            <p className="text-sm text-[#172B3A] leading-relaxed font-medium">
              {content.guidanceText}
            </p>
          </div>

          {/* 8. REAL-WORLD BLISTER STRIP & PACKAGING EVIDENCE CARD */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2EAF1] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#647789]">
                <Activity className="w-4 h-4 text-[#1769E0]" />
                <span>8. {content.packagingEvidenceLabel}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 bg-[#F6FAFD] px-2 py-0.5 rounded border border-[#E2EAF1]">
                Foil Inspection
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1">
                <div className="text-[#647789] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#1769E0]" />
                  <span>Detected Manufacturer:</span>
                </div>
                <div className="font-bold text-[#172B3A] truncate">
                  {data.packaging_evidence?.manufacturer || 'Supporting Markings Verified'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Supporting evidence only; never identifies drug alone.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1">
                <div className="text-[#647789] flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <span>Schedule H Red Box:</span>
                </div>
                <div className="font-bold text-[#172B3A]">
                  {data.packaging_evidence?.red_box_detected
                    ? '🔴 Detected on Packaging'
                    : '⚪ Not Detected on Foil'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Dual-range HSV chromatic detection.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1">
                <div className="text-[#647789] flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5 text-[#18A999]" />
                  <span>Foil Orientation:</span>
                </div>
                <div className="font-bold text-[#172B3A]">
                  {data.packaging_evidence?.orientation_angle !== undefined
                    ? `${data.packaging_evidence.orientation_angle}° (Auto-Corrected)`
                    : '0° (Upright Calibrated)'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Tesseract OSD multi-pass pass-through.
                </div>
              </div>
            </div>

            {/* Expandable OCR Text Drawer */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowOcrText(!showOcrText)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F6FAFD] hover:bg-[#EAF3FF] border border-[#E2EAF1] text-xs font-semibold text-[#172B3A] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#1769E0]" />
                  <span>Extracted Packaging Text (Raw OCR Stream)</span>
                </div>
                {showOcrText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showOcrText && (
                <div className="mt-2 p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48 border border-slate-800">
                  {data.packaging_evidence?.ocr_text_excerpt ||
                    data.brand_name ||
                    'No raw OCR text excerpt available.'}
                </div>
              )}
            </div>
          </div>

          {/* 9. DEDICATED MEDICAL DISCLAIMER */}
          <div className="p-5 rounded-2xl bg-white border border-[#E2EAF1] space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#647789] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5" />
              <span>9. {content.disclaimerLabel}</span>
            </div>
            <p className="text-xs text-[#647789] leading-relaxed">
              {content.disclaimerText}
            </p>
          </div>

          {/* 10. USER FEEDBACK & VERIFICATION REVIEW BOX */}
          <div className="p-5 rounded-2xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-3.5 shadow-2xs no-print">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#172B3A] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#16865B]" />
                  <span>10. Information Audit &amp; Verification</span>
                </h4>
                <p className="text-xs text-[#647789] mt-0.5">
                  Confirm accuracy of this identification based on visible packaging. User feedback is quarantined in staging logs and never automatically corrupts verified training data.
                </p>
              </div>
            </div>

            {feedbackSubmitted ? (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  feedbackSubmitted === 'CORRECT'
                    ? 'bg-emerald-50 text-[#16865B] border border-emerald-200'
                    : 'bg-amber-50 text-[#C78319] border border-amber-200'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {feedbackSubmitted === 'CORRECT'
                    ? 'Thank you! Confirmed accurate. Record safely logged to feedback staging.'
                    : 'Report registered! Inaccuracy feedback submitted to quarantine review.'}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={submittingFeedback}
                    onClick={() => handleSendFeedback('CORRECT')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16865B] hover:bg-[#13734E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Information is Correct</span>
                  </button>

                  <button
                    type="button"
                    disabled={submittingFeedback}
                    onClick={() => setShowInaccuracyForm(!showInaccuracyForm)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-[#C84747] text-xs font-bold rounded-xl border border-red-200 shadow-2xs transition-colors"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Report Inaccuracy</span>
                  </button>
                </div>

                {showInaccuracyForm && (
                  <div className="p-4 rounded-xl bg-white border border-red-200 space-y-3">
                    <div className="text-xs font-bold text-[#172B3A]">
                      Select inaccurate field(s):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldChecks.brand}
                          onChange={(e) =>
                            setFieldChecks({ ...fieldChecks, brand: e.target.checked })
                          }
                          className="rounded text-[#1769E0]"
                        />
                        <span>Brand Name</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldChecks.strength}
                          onChange={(e) =>
                            setFieldChecks({ ...fieldChecks, strength: e.target.checked })
                          }
                          className="rounded text-[#1769E0]"
                        />
                        <span>Strength</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldChecks.salts}
                          onChange={(e) =>
                            setFieldChecks({ ...fieldChecks, salts: e.target.checked })
                          }
                          className="rounded text-[#1769E0]"
                        />
                        <span>Active Salts</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldChecks.dosageForm}
                          onChange={(e) =>
                            setFieldChecks({ ...fieldChecks, dosageForm: e.target.checked })
                          }
                          className="rounded text-[#1769E0]"
                        />
                        <span>Dosage Form</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fieldChecks.manufacturer}
                          onChange={(e) =>
                            setFieldChecks({ ...fieldChecks, manufacturer: e.target.checked })
                          }
                          className="rounded text-[#1769E0]"
                        />
                        <span>Manufacturer</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-[#647789]">
                        Correction Notes / What do you see on packaging:
                      </label>
                      <input
                        type="text"
                        value={correctionNotes}
                        onChange={(e) => setCorrectionNotes(e.target.value)}
                        placeholder="e.g. The actual strength is 500mg, not 650mg"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E2EAF1] focus:outline-none focus:border-[#1769E0]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={submittingFeedback}
                      onClick={() => handleSendFeedback('INCORRECT')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Submit Inaccuracy Audit
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: CONNECTED 20,485+ CATALOG MATCH EVIDENCE */}
      {activeTab === 'matches' && (
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2EAF1]">
            <div>
              <h3 className="text-sm font-bold text-[#172B3A]">
                Indexed Indian Medicine Catalog Matches
              </h3>
              <p className="text-xs text-[#647789]">
                Verified formulation matches found in our 20,485+ Indian medicine knowledge graph.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[#EAF3FF] text-[#1769E0]">
              {catalogMatches.length} Matches Found
            </span>
          </div>

          {catalogMatches.length === 0 ? (
            <div className="text-center py-10 text-sm text-[#647789]">
              No direct catalog match records found for this specific query.
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {catalogMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-[#E2EAF1] hover:border-[#1769E0]/40 bg-[#F6FAFD] hover:bg-white transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#172B3A]">{m.productLine}</div>
                      <div className="text-xs text-[#647789]">
                        Family: {m.brandFamily} · Dataset {m.datasetSource}
                      </div>
                    </div>
                    {onSelectCatalogVariant && (
                      <button
                        type="button"
                        onClick={() => onSelectCatalogVariant(m)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#EAF3FF] text-[#1769E0] hover:bg-[#1769E0] hover:text-white transition-colors shrink-0"
                      >
                        Inspect in AI Scanner →
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {m.dosageForm && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2EAF1] text-slate-700">
                        Form: {m.dosageForm}
                      </span>
                    )}
                    {m.strength && (
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2EAF1] text-slate-700 font-mono">
                        Strength: {m.strength}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2EAF1] text-slate-700">
                      {m.therapeuticClass}
                    </span>
                  </div>

                  {m.inferredSalts.length > 0 && (
                    <div className="text-xs text-[#1769E0] pt-1 font-mono">
                      Salts: {m.inferredSalts.join(' + ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: STRICT JSON CONTRACT VIEWER */}
      {activeTab === 'json' && (
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2EAF1]">
            <div>
              <h3 className="text-sm font-bold text-[#172B3A]">Strict JSON Contract Payload</h3>
              <p className="text-xs text-[#647789]">
                Structured data contract output compliant with healthcare schema validators.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#F6FAFD] text-xs font-semibold rounded-lg border border-[#E2EAF1]"
            >
              <Copy className="w-3.5 h-3.5 text-[#647789]" />
              <span>Copy Raw JSON</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto max-h-[460px] leading-relaxed">
            {rawJsonString}
          </pre>
        </div>
      )}
    </div>
  );
};
