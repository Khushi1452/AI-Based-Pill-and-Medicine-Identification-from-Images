import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  X,
  ScanLine,
  ShieldCheck,
  AlertOctagon,
  FileCheck2,
  RotateCcw,
  Sparkles,
  Info,
  Pill,
  ArrowRight,
  Eye,
  Check,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Building2,
} from 'lucide-react';
import type {
  AnalyzeApiEnvelope,
  CatalogStats,
  CatalogVariant,
  CalibrationRule,
  LanguageMode,
} from './types/medicine';
import {
  renderSpecimenToDataUrl,
  type SpecimenPreset,
} from './utils/specimenGenerator';
import { Navbar } from './components/Navbar';
import { DoctorPortal } from './components/DoctorPortal';

import { MedicalAIVisual } from './components/MedicalAIVisual';
import { HowItWorksSection } from './components/HowItWorksSection';
import { SafetyGuideSection } from './components/SafetyGuideSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { AnalysisResultPanel } from './components/AnalysisResultPanel';
import { CatalogExplorer } from './components/CatalogExplorer';
import { AccuracyTrainerLab } from './components/AccuracyTrainerLab';

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageMode>('en');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [packagingTextHint, setPackagingTextHint] = useState<string>('');
  const [userQuestion, setUserQuestion] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string>('');

  const [envelope, setEnvelope] = useState<AnalyzeApiEnvelope | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  // Camera state
  const [cameraOpen, setCameraOpen] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const scrollToScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAnalyze = async (overrideImage?: string, overrideHint?: string) => {
    const imgToUse = overrideImage !== undefined ? overrideImage : imagePreview;
    const hintToUse = overrideHint !== undefined ? overrideHint : packagingTextHint;

    if (!imgToUse && !hintToUse) {
      setError('Please upload a medicine packaging photograph first.');
      return;
    }

    setLoading(true);
    setAnalysisProgress(6);
    setError(null);

    // Smooth progressive percentage animation across OCR & verification stages
    let progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev < 25) return prev + Math.floor(Math.random() * 4 + 3);
        if (prev < 55) return prev + Math.floor(Math.random() * 3 + 2);
        if (prev < 82) return prev + Math.floor(Math.random() * 2 + 1);
        if (prev < 96) return prev + 1;
        return 96;
      });
    }, 85);

    try {
      const res = await fetch('/api/medicine/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgToUse,
          mimeType: imageMimeType,
          packagingTextHint: hintToUse,
          userQuestion: userQuestion.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || 'Failed to analyze medicine packaging.';
        try {
          const parsed = JSON.parse(msg);
          if (parsed.error?.message) msg = parsed.error.message;
        } catch { }
        throw new Error(msg);
      }

      // Complete to 100% and hold briefly so user sees the verified state
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 450));

      setEnvelope(data);
      showToast('Medicine analyzed successfully');
      // Scroll to results panel
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      clearInterval(progressInterval);
      setAnalysisProgress(0);
      setError(err?.message || 'An unexpected error occurred during analysis.');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      
    }
  };

  // Load catalog stats on mount
  useEffect(() => {
    fetch('/api/catalog/stats')

    .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCatalogStats(data);
      })
      .catch(() => { });
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleOpenCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 50);
      showToast('Camera scanner activated');
    } catch (err: any) {
      setCameraError(
        err?.message || 'Camera access was denied or is unavailable in this browser environment.'
      );
    }
  };

  const handleCaptureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 540;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setImagePreview(dataUrl);
      setImageMimeType('image/jpeg');
      setPackagingTextHint('');
      setActivePresetId('');
      showToast('Packaging photo captured');
    }
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
        setImageMimeType(file.type || 'image/jpeg');
        setPackagingTextHint('');
        setActivePresetId('');
        setError(null);
        showToast('Photo uploaded');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectCatalogVariant = (variant: CatalogVariant) => {
    const saltsText =
      variant.inferredSalts && variant.inferredSalts.length > 0
        ? variant.inferredSalts.join(' + ')
        : `${variant.productLine} (${variant.therapeuticClass})`;

    const syntheticPreset: SpecimenPreset = {
      id: variant.id,
      title: variant.productLine,
      subtitle: `Dataset ${variant.datasetSource} · ${variant.brandFamily}`,
      scenarioType: 'dataset_match',
      brandName: variant.productLine,
      genericComposition: saltsText,
      dosageForm: variant.dosageForm || 'Formulation',
      strength: variant.strength || 'Standard Pack',
      scheduleWarning:
        variant.isPrescriptionRequired === false
          ? null
          : 'SCHEDULE H PRESCRIPTION DRUG - CAUTION: Not to be sold by retail without the prescription of a Registered Medical Practitioner.',
      manufacturer: `Indian Pharmaceutical Reference Index (${variant.datasetSource})`,
      batchInfo: `Catalog ID: ${variant.id} · Pack: ${variant.packSize || 'Standard'} · ${variant.therapeuticClass}`,
      packagingTextHint: `${variant.productLine} | Composition: ${saltsText}`,
    };

    const dataUrl = renderSpecimenToDataUrl(syntheticPreset);
    setImagePreview(dataUrl);
    setImageMimeType('image/png');
    setPackagingTextHint(syntheticPreset.packagingTextHint || variant.productLine);
    setActivePresetId(variant.id);

    scrollToScanner();
    handleAnalyze(dataUrl, syntheticPreset.packagingTextHint || variant.productLine);
    showToast(`Inspecting ${variant.productLine}`);
  };

  const handleTestCalibrationRule = (rule: CalibrationRule) => {
    const saltsText = rule.activeSalts.join(' + ');
    const syntheticPreset: SpecimenPreset = {
      id: rule.id,
      title: rule.brandPattern,
      subtitle: `Calibration Rule · ${rule.dosageForm}`,
      scenarioType: 'verified_rx',
      brandName: rule.brandPattern,
      genericComposition: saltsText,
      dosageForm: rule.dosageForm,
      strength: rule.strength,
      scheduleWarning: rule.isPrescriptionRequired
        ? 'SCHEDULE H PRESCRIPTION DRUG - CAUTION: Not to be sold by retail without the prescription of a Registered Medical Practitioner.'
        : null,
      manufacturer: 'Calibrated Indian Pharma Knowledge Memory',
      batchInfo: `${rule.therapeuticClass}`,
      packagingTextHint: `${rule.brandPattern} | ${saltsText}`,
    };

    const dataUrl = renderSpecimenToDataUrl(syntheticPreset);
    setImagePreview(dataUrl);
    setImageMimeType('image/png');
    setPackagingTextHint(syntheticPreset.packagingTextHint || rule.brandPattern);
    setActivePresetId(rule.id);

    scrollToScanner();
    handleAnalyze(dataUrl, syntheticPreset.packagingTextHint || rule.brandPattern);
    showToast(`Testing rule ${rule.brandPattern}`);
  };

  const handleReset = () => {
    setImagePreview(null);
    setPackagingTextHint('');
    setUserQuestion('');
    setActivePresetId('');
    setEnvelope(null);
    setError(null);
    setAnalysisProgress(0);
    scrollToScanner();
  };

  const toggleLanguage = () => {
    setCurrentLanguage((prev) => {
      if (prev === 'en') {
        showToast('Language: Hinglish selected');
        return 'hinglish';
      }
      if (prev === 'hinglish') {
        showToast('भाषा: हिंदी (Devanagari) चुनी गई');
        return 'hi';
      }
      showToast('Language: English selected');
      return 'en';
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6FAFD] text-[#172B3A]">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172B3A] text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-[#18A999]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar
        currentLanguage={currentLanguage}
        onToggleLanguage={toggleLanguage}
        onSelectLanguage={(lang) => {
          setCurrentLanguage(lang);
          showToast(
            lang === 'en'
              ? 'Language: English selected'
              : lang === 'hinglish'
              ? 'Language: Hinglish selected'
              : 'भाषा: हिंदी चुनी गई'
          );
        }}
        onNavigateToUpload={scrollToScanner}
      />

      <main className="flex-1 space-y-24 pb-24">
        {/* 1. HERO SECTION */}
        <section id="hero" className="pt-12 sm:pt-20 pb-16 overflow-hidden relative hero-glow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Eyebrow, Headlines, CTAs, Trust Items */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 text-[#1769E0] border border-[#1769E0]/20 shadow-xs backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-ping" />
                  <span>AI-Powered Clinical Medicine Identification</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-[#172B3A] tracking-tight leading-[1.12]">
                  Know Your Medicine.{' '}
                  <span className="bg-gradient-to-r from-[#1769E0] via-[#1255B8] to-[#18A999] bg-clip-text text-transparent">
                    Understand It Better.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-[#647789] max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Upload a photo of your medicine packaging to explore its active ingredients, common uses, and important safety precautions in simple Hindi and English.
                </p>

                {/* Primary & Secondary Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <a
                    href="#doctor-portal"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#1769E0] to-[#1255B8] hover:from-[#1255B8] hover:to-[#0E4598] text-white text-sm sm:text-base font-bold rounded-xl shadow-lg shadow-[#1769E0]/25 hover:shadow-xl hover:shadow-[#1769E0]/35 active:scale-[0.98] transition-all"
                  >
                    <Stethoscope className="w-5 h-5" />
                    <span>Talk to AI Doctor</span>
                  </a>

                  <button
                    type="button"
                    onClick={scrollToScanner}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/95 hover:bg-white text-[#172B3A] text-sm sm:text-base font-bold rounded-xl border border-[#E2EAF1] shadow-2xs hover:border-[#1769E0]/40 hover:shadow-sm transition-all backdrop-blur-sm"
                  >
                    <ScanLine className="w-4 h-4 text-[#1769E0]" />
                    <span>Scan Medicine</span>
                  </button>

                  <a
                    href="#doctor-portal"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#EAF3FF] hover:bg-[#1769E0] text-[#1769E0] hover:text-white text-sm sm:text-base font-bold rounded-xl border border-[#1769E0]/30 shadow-2xs transition-all"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Find Clinics</span>
                  </a>
                </div>

                {/* 3 Trust-Oriented Items */}
                <div className="pt-6 border-t border-[#E2EAF1] flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-[#647789] font-medium">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 border border-[#E2EAF1]/70 shadow-2xs backdrop-blur-xs">
                    <div className="w-5 h-5 rounded-full bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
                      <Stethoscope className="w-3 h-3" />
                    </div>
                    <span>AI Doctor Consultation</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 border border-[#E2EAF1]/70 shadow-2xs backdrop-blur-xs">
                    <div className="w-5 h-5 rounded-full bg-[#EAF3FF] text-[#18A999] flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>Verified Doctor Directory</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/70 border border-[#E2EAF1]/70 shadow-2xs backdrop-blur-xs">
                    <div className="w-5 h-5 rounded-full bg-[#EAF3FF] text-[#1769E0] flex items-center justify-center">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>112 Emergency Triage</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Medical AI Visual */}
              <div className="lg:col-span-5 flex justify-center">
                <MedicalAIVisual />
              </div>
            </div>
          </div>
        </section>

        {/* 2. DOCTOR CARE & CONSULTATION SUITE */}
        <DoctorPortal
          currentLanguage={currentLanguage}
          onNavigateToScanner={scrollToScanner}
        />

        {/* 3. MAIN MEDICINE UPLOAD & ANALYSIS WORKSPACE */}
        <section id="scanner" ref={scannerRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          <div className="clinical-card p-6 sm:p-10 space-y-8 bg-white border border-[#E2EAF1]/90 shadow-xl shadow-[#12304A]/05">
            {/* Header */}
            <div className="border-b border-[#E2EAF1] pb-6 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20">
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Clinical Scanner Workspace</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#172B3A] tracking-tight">
                  Identify Your Medicine
                </h2>
                <p className="text-sm text-[#647789]">
                  Upload a clear photo of the medicine strip, bottle, box, or tube.
                </p>
              </div>

              {/* Reset Action */}
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#647789] hover:text-[#172B3A] bg-[#F6FAFD] hover:bg-[#EAF3FF] rounded-xl border border-[#E2EAF1] transition-all shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear &amp; Reset</span>
                </button>
              )}
            </div>

            {/* TWO COLUMN SCANNER LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Upload Box, Camera, Presets (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Camera Live Stream Modal / View */}
                {cameraOpen ? (
                  <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 border-2 border-[#1769E0] shadow-md">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {/* Viewfinder Target */}
                    <div className="absolute inset-8 border-2 border-dashed border-white/70 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="text-[11px] text-white font-mono bg-black/60 px-2.5 py-1 rounded-md">
                        Center medicine label here
                      </div>
                    </div>
                    {/* Camera Control Actions */}
                    <div className="absolute bottom-4 inset-x-4 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-white/90 hover:bg-white text-xs font-bold text-[#172B3A] rounded-xl backdrop-blur-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCaptureCameraFrame}
                        className="px-5 py-2.5 bg-[#1769E0] hover:bg-[#1255B8] text-xs font-bold text-white rounded-xl shadow-lg flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture Photo</span>
                      </button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  /* Uploaded Image Preview */
                  <div className="relative rounded-2xl overflow-hidden border border-[#E2EAF1] bg-[#F6FAFD] p-2 space-y-3">
                    <div className="relative rounded-xl overflow-hidden aspect-4/3 bg-slate-100 flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Medicine packaging preview"
                        className="w-full h-full object-contain"
                      />
                      {loading && (
                        <>
                          <div className="scanner-laser" />
                          <div className="absolute inset-0 bg-[#0A1628]/65 backdrop-blur-[2px] flex flex-col items-center justify-center text-white z-10 p-4 transition-all">
                            {/* Round Animated Circular Progress Bar */}
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="rgba(255,255,255,0.18)"
                                  strokeWidth="6"
                                  fill="transparent"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke={analysisProgress >= 100 ? '#18A999' : '#1769E0'}
                                  strokeWidth="6"
                                  strokeDasharray={251.3}
                                  strokeDashoffset={251.3 - (251.3 * Math.min(analysisProgress, 100)) / 100}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  className="transition-all duration-150 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-extrabold font-mono tabular-nums leading-none">
                                  {Math.round(analysisProgress)}%
                                </span>
                                <span className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold mt-1">
                                  {analysisProgress >= 100 ? 'Verified' : 'Scanning'}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-medium text-slate-200 text-center max-w-[220px] truncate shadow-2xs">
                              {analysisProgress < 28
                                ? 'Preprocessing image...'
                                : analysisProgress < 60
                                ? 'Extracting packaging text...'
                                : analysisProgress < 85
                                ? 'Matching 20,400+ database...'
                                : analysisProgress < 100
                                ? 'Synthesizing report...'
                                : 'Analysis complete!'}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-[#172B3A] truncate max-w-[200px]">
                        {activePresetId ? 'Specimen Test Preset' : 'Uploaded Photo'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-semibold text-[#1769E0] hover:underline"
                        >
                          Replace
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setActivePresetId('');
                          }}
                          className="text-xs font-semibold text-[#C84747] hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drag & Drop Upload Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#1769E0]/35 hover:border-[#1769E0] bg-gradient-to-b from-[#EAF3FF]/40 to-[#EAF3FF]/15 hover:bg-[#EAF3FF]/60 rounded-2xl p-8 sm:p-10 text-center space-y-4 cursor-pointer transition-all group shadow-2xs hover:shadow-md"
                  >
                    <div className="relative w-16 h-16 rounded-2xl bg-white text-[#1769E0] border border-[#1769E0]/20 group-hover:scale-105 group-hover:bg-[#1769E0] group-hover:text-white transition-all flex items-center justify-center mx-auto shadow-sm">
                      <Upload className="w-7 h-7" />
                      <span className="absolute -inset-1 rounded-2xl border border-[#1769E0]/20 animate-ping pointer-events-none group-hover:opacity-100 opacity-0" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-base font-bold text-[#172B3A] group-hover:text-[#1769E0] transition-colors">
                        Click or drag medicine photo here
                      </h4>
                      <p className="text-xs text-[#647789] max-w-xs mx-auto">
                        Photograph blister packs, syrup bottles, carton boxes, or tubes
                      </p>
                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-[#E2EAF1]">
                          JPG
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-[#E2EAF1]">
                          PNG
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-[#E2EAF1]">
                          WEBP
                        </span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Max 25MB
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Camera Trigger Button */}
                {!cameraOpen && (
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white hover:bg-[#EAF3FF]/80 text-[#172B3A] text-xs font-bold rounded-xl border border-[#E2EAF1] hover:border-[#1769E0]/30 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="w-5 h-5 rounded-lg bg-[#EAF3FF] flex items-center justify-center">
                      <Camera className="w-3.5 h-3.5 text-[#1769E0]" />
                    </div>
                    <span>Use Device Camera Scanner</span>
                  </button>
                )}

                {cameraError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#C84747] flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Optional Text Inputs */}
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#172B3A]">
                      Packaging Text Clue (Optional):
                    </label>
                    <input
                      type="text"
                      value={packagingTextHint}
                      onChange={(e) => setPackagingTextHint(e.target.value)}
                      placeholder="e.g. Allegra 120, Aziderm, Paracip 650..."
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-[#647789] focus:outline-none focus:bg-white focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/15 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[#172B3A]">
                      Patient Question (Optional):
                    </label>
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder="e.g. What is this tablet taken for?"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#F6FAFD] border border-[#E2EAF1] rounded-xl text-[#172B3A] placeholder:text-[#647789] focus:outline-none focus:bg-white focus:border-[#1769E0] focus:ring-2 focus:ring-[#1769E0]/15 transition-all"
                    />
                  </div>
                </div>

                {/* Primary Analyze Button */}
                <button
                  type="button"
                  disabled={loading || (!imagePreview && !packagingTextHint)}
                  onClick={() => handleAnalyze()}
                  className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-[#1769E0] to-[#1255B8] hover:from-[#1255B8] hover:to-[#0E4598] disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md shadow-[#1769E0]/20 hover:shadow-lg hover:shadow-[#1769E0]/30 active:scale-[0.98] transition-all"
                >
                  {loading ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Packaging...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4" />
                      <span>Analyze Medicine</span>
                    </>
                  )}
                </button>

                {/* Photo Quality Guide Pill Banner */}
                <div className="p-4 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-2.5">
                  <div className="text-xs font-bold text-[#172B3A] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#1769E0]" />
                    <span>Photo Quality Checklist:</span>
                  </div>
                  <ul className="text-xs text-[#647789] space-y-1.5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16865B] shrink-0" />
                      <span>Keep brand title and active salt clearly readable</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16865B] shrink-0" />
                      <span>Avoid camera flash glare &amp; shadows on foil</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16865B] shrink-0" />
                      <span>Include strength numbers (e.g., 500mg, 10mg)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16865B] shrink-0" />
                      <span>Photograph one medicine package at a time</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* RIGHT COLUMN: Results Display Panel (7 cols) */}
              <div ref={resultsRef} className="lg:col-span-7 scroll-mt-24">
                <AnalysisResultPanel
                  envelope={envelope}
                  loading={loading}
                  error={error}
                  uploadedThumbnail={imagePreview}
                  analysisProgress={analysisProgress}
                  initialLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                  onRetry={() => handleAnalyze()}
                  onReset={handleReset}
                  onSelectCatalogVariant={handleSelectCatalogVariant}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION */}
        <HowItWorksSection
          currentLanguage={currentLanguage}
          onGetStarted={scrollToScanner}
        />

        {/* 4. SAFETY GUIDE SECTION */}
        <SafetyGuideSection currentLanguage={currentLanguage} />

        {/* 5. 20,400+ INDIAN MEDICINE CATALOG EXPLORER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CatalogExplorer
            stats={catalogStats}
            onSelectVariantForInspection={handleSelectCatalogVariant}
          />
        </section>

        {/* 6. MODEL ACCURACY & CALIBRATION TRAINER LAB */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AccuracyTrainerLab onTestCalibrationRule={handleTestCalibrationRule} />
        </section>

        {/* 7. FREQUENTLY ASKED QUESTIONS */}
        <FAQSection currentLanguage={currentLanguage} />
      </main>

      {/* Global Footer */}
      <Footer currentLanguage={currentLanguage} />
    </div>
  );
}
