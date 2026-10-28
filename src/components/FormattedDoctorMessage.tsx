import React, { useState } from 'react';
import {
  Stethoscope,
  Pill,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Info,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  FileText,
  BookmarkCheck,
  Printer,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Thermometer,
  HeartPulse,
  Phone,
  Utensils,
  Ban,
  Activity,
  Sun,
  Moon,
  Sunrise,
} from 'lucide-react';

interface FormattedDoctorMessageProps {
  text: string;
  isEmergency?: boolean;
  emergencyNotice?: string;
  language?: 'en' | 'hi' | 'hinglish';
  onAddToDossier?: (text: string) => void;
}

interface ParsedSection {
  type:
    | 'emergency'
    | 'medicine_id'
    | 'indications'
    | 'usage'
    | 'how_to_take'
    | 'schedule'
    | 'benefits'
    | 'precautions'
    | 'side_effects'
    | 'storage'
    | 'doctor_summary'
    | 'disclaimer'
    | 'general';
  title?: string;
  lines: string[];
}

export const FormattedDoctorMessage: React.FC<FormattedDoctorMessageProps> = ({
  text,
  isEmergency,
  emergencyNotice,
  language = 'en',
  onAddToDossier,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [addedToDossier, setAddedToDossier] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean text of markdown characters, headers, emojis for natural speech
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      .replace(/\|/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    if (language === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleDossierAdd = () => {
    if (onAddToDossier) {
      onAddToDossier(text);
      setAddedToDossier(true);
      setTimeout(() => setAddedToDossier(false), 2500);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=700');
    if (!printWindow) {
      window.print();
      return;
    }

    const cleanHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dr. Ayesha AI Clinical Consultation Advice</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #172B3A; line-height: 1.6; }
            h1 { color: #1769E0; font-size: 20px; border-bottom: 2px solid #E2EAF1; padding-bottom: 8px; margin-bottom: 16px; }
            h2 { color: #12304A; font-size: 16px; margin-top: 20px; border-left: 4px solid #1769E0; padding-left: 8px; }
            p { margin: 6px 0; font-size: 14px; }
            ul { margin: 6px 0 12px 20px; }
            li { margin-bottom: 4px; font-size: 13.5px; }
            .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #EAF3FF; color: #1769E0; font-size: 11px; font-weight: bold; }
            .disclaimer { margin-top: 24px; padding: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; font-size: 11px; color: #64748B; font-style: italic; }
            .footer { margin-top: 30px; font-size: 11px; color: #94A3B8; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Mediscan AI Doctor Consultation &amp; Medicine Usage Guide</h1>
          <p><strong>Clinical Advisor:</strong> Dr. Ayesha, MD (AI Senior Medical Advisor)</p>
          <p><strong>Date &amp; Time:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: 0; border-top: 1px solid #E2EAF1; margin: 16px 0;" />
          <div>${text.replace(/\n/g, '<br/>')}</div>
          <div class="disclaimer">
            Clinical Disclaimer: This guidance is for educational and clinical decision-support purposes only and does not replace an in-person physical consultation with a registered medical practitioner. In case of emergency, immediately dial 112 or 108.
          </div>
          <div class="footer">Printed from Mediscan Healthcare Assistant Platform</div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(cleanHtml);
    printWindow.document.close();
  };

  // Helper to format inline bold, markdown links, code tokens
  const renderInlineFormatted = (line: string) => {
    // Replace **text** with bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={idx} className="font-extrabold text-[#172B3A]">
            {inner}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Helper to parse key-value lines like "**Brand Name:** Crocin 650"
  const parseKeyValue = (line: string): { key: string; value: string } | null => {
    const match = line.match(/^[-*]?\s*\*\*([^*]+)\*\*[:\s]+(.+)$/);
    if (match) {
      return { key: match[1].trim(), value: match[2].trim() };
    }
    const plainMatch = line.match(/^[-*]?\s*([^:]+):\s+(.+)$/);
    if (
      plainMatch &&
      [
        'brand name',
        'active salts',
        'active ingredients',
        'strength',
        'dosage form',
        'formulation',
        'therapeutic classification',
        'therapeutic class',
        'how to take',
        'timing',
        'food & timing',
        'food timing',
        'food relationship',
        'morning',
        'afternoon',
        'evening',
        'night',
        'frequency',
        'benefit',
        'benefits',
        'adult dosage',
        'course duration',
        'schedule status',
        'prescription schedule',
        'contraindications',
        'storage',
        'missed dose',
      ].some((k) => plainMatch[1].toLowerCase().includes(k))
    ) {
      return { key: plainMatch[1].trim(), value: plainMatch[2].trim() };
    }
    return null;
  };

  // Parse lines into distinct semantic sections
  const parseIntoSections = (rawText: string): ParsedSection[] => {
    const lines = rawText.split('\n');
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection = {
      type: 'general',
      lines: [],
    };

    const flushCurrent = () => {
      if (currentSection.lines.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lower = line.toLowerCase();

      // Emergency Detection
      if (
        line.includes('🚨') ||
        lower.includes('emergency detected') ||
        lower.includes('critical medical emergency') ||
        lower.includes('red flag') ||
        line.includes('खतरे के संकेत')
      ) {
        flushCurrent();
        currentSection = {
          type: 'emergency',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Medicine Identification
      if (
        line.includes('🏷️') ||
        lower.includes('medicine identification') ||
        lower.includes('identification & classification') ||
        line.includes('दवा पहचान')
      ) {
        flushCurrent();
        currentSection = {
          type: 'medicine_id',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // When to Take & Timing Schedule / Food Routine
      if (
        line.includes('⏰') ||
        lower.includes('when to take') ||
        lower.includes('timing schedule') ||
        lower.includes('food & timing') ||
        line.includes('समय और भोजन') ||
        line.includes('समय सारिणी') ||
        line.includes('कब लें') ||
        line.includes('भोजन का नियम')
      ) {
        flushCurrent();
        currentSection = {
          type: 'schedule',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // How to Take (Administration Method)
      if (
        line.includes('💊') ||
        lower.includes('how to take') ||
        lower.includes('administration guide') ||
        lower.includes('sevan vidhi') ||
        line.includes('सेवन का सही तरीका') ||
        line.includes('सेवन की विधि') ||
        line.includes('कैसे लें')
      ) {
        flushCurrent();
        currentSection = {
          type: 'how_to_take',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Key Health & Therapeutic Benefits
      if (
        line.includes('✨') ||
        line.includes('🌟') ||
        lower.includes('key health benefits') ||
        lower.includes('key benefits') ||
        lower.includes('therapeutic benefits') ||
        line.includes('प्रमुख लाभ') ||
        line.includes('लाभ व फायदे') ||
        line.includes('फायदे')
      ) {
        flushCurrent();
        currentSection = {
          type: 'benefits',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Primary Indications
      if (
        line.includes('🎯') ||
        lower.includes('primary indications') ||
        lower.includes('what it is used for') ||
        lower.includes('clinical uses') ||
        line.includes('उपयोग व राहत') ||
        line.includes('प्रमुख उपयोग')
      ) {
        flushCurrent();
        currentSection = {
          type: 'indications',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Complete Usage & Administration
      if (
        lower.includes('usage & administration') ||
        lower.includes('dosage guide') ||
        line.includes('उपयोग विधि')
      ) {
        flushCurrent();
        currentSection = {
          type: 'usage',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Precautions & Warnings
      if (
        line.includes('⚠️') ||
        lower.includes('precautions & warnings') ||
        lower.includes('essential safety precautions') ||
        lower.includes('safety warnings') ||
        line.includes('सावधानियां') ||
        line.includes('सुरक्षा चेतावनी')
      ) {
        flushCurrent();
        currentSection = {
          type: 'precautions',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Side Effects
      if (
        line.includes('⚡') ||
        lower.includes('side effects') ||
        lower.includes('potential side effects') ||
        lower.includes('adverse reactions') ||
        line.includes('संभावित दुष्प्रभाव') ||
        line.includes('साइड इफेक्ट्स')
      ) {
        flushCurrent();
        currentSection = {
          type: 'side_effects',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Storage & Missed Dose
      if (
        line.includes('🕒') ||
        lower.includes('missed dose & proper storage') ||
        lower.includes('missed dose & storage') ||
        lower.includes('proper storage') ||
        line.includes('भंडारण') ||
        line.includes('खुराक छूटने पर')
      ) {
        flushCurrent();
        currentSection = {
          type: 'storage',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Doctor Summary / Advice
      if (
        line.includes('👨‍⚕️') ||
        lower.includes('clinical summary') ||
        lower.includes("dr. ayesha's advice") ||
        lower.includes('doctor summary') ||
        line.includes('चिकित्सकीय सलाह')
      ) {
        flushCurrent();
        currentSection = {
          type: 'doctor_summary',
          title: line.replace(/^[#*_\s]+/, ''),
          lines: [],
        };
        continue;
      }

      // Disclaimers
      if (
        lower.includes('clinical disclaimer:') ||
        lower.includes('disclaimer:') ||
        line.includes('अस्वीकरण:')
      ) {
        flushCurrent();
        currentSection = {
          type: 'disclaimer',
          title: 'Clinical Disclaimer',
          lines: [line],
        };
        continue;
      }

      // General markdown heading
      if (line.startsWith('### ') || line.startsWith('## ')) {
        flushCurrent();
        currentSection = {
          type: 'general',
          title: line.replace(/^#{2,3}\s+/, ''),
          lines: [],
        };
        continue;
      }

      if (line) {
        currentSection.lines.push(line);
      }
    }

    flushCurrent();
    return sections;
  };

  const sections = parseIntoSections(text);

  // Helper to render lines of text with list handling and key-value card parsing
  const renderSectionBody = (
    lines: string[],
    bulletColor = '#1769E0',
    keyBadgeBg = '#EAF3FF',
    keyBadgeText = '#1769E0'
  ) => {
    const elements: React.ReactNode[] = [];
    let currentList: string[] = [];

    const flushBulletList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 pl-1">
            {currentList.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-[#172B3A] leading-relaxed"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: bulletColor }}
                />
                <span className="flex-1">{renderInlineFormatted(item)}</span>
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      // Check for Key-Value pair (e.g. - **Brand Name:** Crocin)
      const kv = parseKeyValue(line);
      if (kv) {
        flushBulletList();
        elements.push(
          <div
            key={`kv-${idx}`}
            className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 py-1.5 px-2.5 rounded-xl bg-white/70 border border-slate-100 text-xs sm:text-sm my-1"
          >
            <span
              className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md self-start shrink-0"
              style={{ backgroundColor: keyBadgeBg, color: keyBadgeText }}
            >
              {kv.key}
            </span>
            <span className="font-semibold text-[#172B3A] flex-1">
              {renderInlineFormatted(kv.value)}
            </span>
          </div>
        );
        return;
      }

      // Check for List item
      if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
        const clean = line.replace(/^[-*]\s+|\d+\.\s+/, '');
        currentList.push(clean);
        return;
      }

      flushBulletList();

      elements.push(
        <p
          key={`p-${idx}`}
          className="text-xs sm:text-sm text-[#172B3A] leading-relaxed my-1.5"
        >
          {renderInlineFormatted(line)}
        </p>
      );
    });

    flushBulletList();
    return elements;
  };

  return (
    <div className="space-y-3.5 print:p-0">
      {/* Visual Section Cards */}
      <div className="space-y-3.5">
        {sections.map((sec, sIdx) => {
          switch (sec.type) {
            case 'emergency':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#C84747]/10 via-[#C84747]/5 to-white border-2 border-[#C84747]/40 shadow-sm space-y-2 animate-pulse"
                >
                  <div className="flex items-center gap-2 text-[#C84747] font-extrabold text-sm tracking-wide uppercase">
                    <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                    <span>{sec.title || 'CRITICAL MEDICAL EMERGENCY DETECTED'}</span>
                  </div>
                  {emergencyNotice && (
                    <p className="text-xs font-bold text-[#9B2C2C] bg-[#C84747]/10 p-2 rounded-xl border border-[#C84747]/20">
                      Reason: {emergencyNotice}
                    </p>
                  )}
                  <div className="space-y-1 text-xs sm:text-sm text-[#172B3A]">
                    {renderSectionBody(sec.lines, '#C84747', '#C84747]/10', '#C84747')}
                  </div>
                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href="tel:112"
                      className="px-3.5 py-1.5 rounded-xl bg-[#C84747] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#A83737] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Emergency 112</span>
                    </a>
                    <a
                      href="tel:108"
                      className="px-3.5 py-1.5 rounded-xl bg-[#1769E0] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#1255B8] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Ambulance 108</span>
                    </a>
                  </div>
                </div>
              );

            case 'medicine_id':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#EAF3FF] via-[#F6FAFD] to-white border border-[#1769E0]/25 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[#1769E0]/15 pb-2">
                    <div className="flex items-center gap-2 text-[#1769E0] font-extrabold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-[#1769E0] text-white shadow-xs">
                        <Pill className="w-4 h-4" />
                      </div>
                      <span>{sec.title || 'Medicine Identification & Clinical Classification'}</span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#1769E0]/10 text-[#1769E0] border border-[#1769E0]/20">
                      Verified Data
                    </span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#1769E0', '#EAF3FF', '#1769E0')}
                  </div>
                </div>
              );

            case 'indications':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#E8F8F5] via-[#F6FAFD] to-white border border-[#18A999]/30 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[#148B7D] font-extrabold text-xs sm:text-sm border-b border-[#18A999]/15 pb-2">
                    <div className="p-1.5 rounded-lg bg-[#18A999] text-white shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span>{sec.title || 'Primary Indications & What It Is Used For'}</span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#18A999', '#E8F8F5', '#148B7D')}
                  </div>
                </div>
              );

            case 'how_to_take':
            case 'usage':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#F0FDF4] via-[#F6FAFD] to-white border border-[#16865B]/30 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[#16865B]/15 pb-2">
                    <div className="flex items-center gap-2 text-[#16865B] font-extrabold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-[#16865B] text-white shadow-xs">
                        <Pill className="w-4 h-4" />
                      </div>
                      <span>{sec.title || 'How to Take & Administration Guide (सेवन की विधि)'}</span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#16865B]/10 text-[#16865B] border border-[#16865B]/20">
                      Administration Guide
                    </span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#16865B', '#F0FDF4', '#16865B')}
                  </div>
                </div>
              );

            case 'schedule':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#ECFDF5] via-[#F6FAFD] to-white border border-[#10B981]/35 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#10B981]/20 pb-2">
                    <div className="flex items-center gap-2 text-[#047857] font-extrabold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-[#059669] text-white shadow-xs">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span>{sec.title || 'When to Take & Food Schedule (समय व भोजन का नियम)'}</span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#059669]/10 text-[#047857] border border-[#059669]/20 flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      <span>Food &amp; Timing</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#059669', '#DCFCE7', '#047857')}
                  </div>
                </div>
              );

            case 'benefits':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF5FF] via-[#F6FAFD] to-white border border-[#8B5CF6]/30 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-[#8B5CF6]/20 pb-2">
                    <div className="flex items-center gap-2 text-[#6D28D9] font-extrabold text-xs sm:text-sm">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#1769E0] text-white shadow-xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span>{sec.title || 'Key Health & Therapeutic Benefits (प्रमुख लाभ व फायदे)'}</span>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#6D28D9] border border-[#8B5CF6]/20">
                      Verified Relief
                    </span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#7C3AED', '#F3E8FF', '#6D28D9')}
                  </div>
                </div>
              );

            case 'precautions':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#FFFBEB] via-[#F6FAFD] to-white border border-[#C78319]/35 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[#C78319] font-extrabold text-xs sm:text-sm border-b border-[#C78319]/20 pb-2">
                    <div className="p-1.5 rounded-lg bg-[#C78319] text-white shadow-xs">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <span>{sec.title || 'Essential Safety Precautions, Schedule & Warnings'}</span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#C78319', '#FEF3C7', '#B45309')}
                  </div>
                </div>
              );

            case 'side_effects':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF1F2] via-[#F6FAFD] to-white border border-[#E11D48]/25 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[#BE123C] font-extrabold text-xs sm:text-sm border-b border-[#E11D48]/15 pb-2">
                    <div className="p-1.5 rounded-lg bg-[#E11D48] text-white shadow-xs">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span>{sec.title || 'Potential Side Effects & When to Seek Help'}</span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#E11D48', '#FFE4E6', '#9F1239')}
                  </div>
                </div>
              );

            case 'storage':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] via-[#F6FAFD] to-white border border-slate-200 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[#475569] font-extrabold text-xs sm:text-sm border-b border-slate-200 pb-2">
                    <div className="p-1.5 rounded-lg bg-slate-600 text-white shadow-xs">
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <span>{sec.title || 'Missed Dose Protocol & Proper Storage Conditions'}</span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#64748B', '#F1F5F9', '#334155')}
                  </div>
                </div>
              );

            case 'doctor_summary':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-4 rounded-2xl bg-gradient-to-br from-[#EFF6FF] via-[#F6FAFD] to-white border border-[#3B82F6]/30 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-xs sm:text-sm border-b border-[#3B82F6]/20 pb-2">
                    <div className="p-1.5 rounded-lg bg-[#2563EB] text-white shadow-xs">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span>{sec.title || "Dr. Ayesha's Clinical Summary & Advice"}</span>
                  </div>
                  <div className="space-y-1">
                    {renderSectionBody(sec.lines, '#2563EB', '#DBEAFE', '#1E40AF')}
                  </div>
                </div>
              );

            case 'disclaimer':
              return (
                <div
                  key={`sec-${sIdx}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#647789] flex items-start gap-2.5 leading-relaxed italic"
                >
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    {sec.lines.map((l, i) => (
                      <p key={i}>{renderInlineFormatted(l)}</p>
                    ))}
                  </div>
                </div>
              );

            default:
              return (
                <div key={`sec-${sIdx}`} className="space-y-1 py-1">
                  {sec.title && (
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#172B3A] flex items-center gap-1.5 mt-2 mb-1">
                      <span className="w-1.5 h-3.5 bg-[#1769E0] rounded-full inline-block" />
                      <span>{renderInlineFormatted(sec.title)}</span>
                    </h4>
                  )}
                  {renderSectionBody(sec.lines)}
                </div>
              );
          }
        })}
      </div>

      {/* Action Toolbar */}
      <div className="pt-2.5 mt-3 border-t border-[#E2EAF1] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#647789]">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-[#172B3A] transition-colors font-medium border border-transparent hover:border-slate-200"
            title="Copy advice to clipboard"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#16865B]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Listen / Read Aloud */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors font-medium border ${
              isSpeaking
                ? 'bg-[#1769E0]/10 text-[#1769E0] border-[#1769E0]/30 font-bold'
                : 'hover:bg-slate-100 hover:text-[#172B3A] border-transparent hover:border-slate-200'
            }`}
            title={isSpeaking ? 'Stop speech' : 'Listen to Dr. Ayesha'}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-[#1769E0] animate-pulse" />
                <span>Stop</span>
                <span className="inline-flex gap-0.5 items-end h-2.5">
                  <span className="w-0.5 h-2 bg-[#1769E0] animate-bounce" />
                  <span className="w-0.5 h-3 bg-[#1769E0] animate-bounce delay-75" />
                  <span className="w-0.5 h-1.5 bg-[#1769E0] animate-bounce delay-150" />
                </span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </>
            )}
          </button>

          {/* Save to Dossier */}
          {onAddToDossier && (
            <button
              type="button"
              onClick={handleDossierAdd}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors font-medium border ${
                addedToDossier
                  ? 'bg-[#16865B]/10 text-[#16865B] border-[#16865B]/30 font-bold'
                  : 'hover:bg-slate-100 hover:text-[#172B3A] border-transparent hover:border-slate-200'
              }`}
              title="Save advice into appointment dossier"
            >
              {addedToDossier ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-[#16865B]" />
                  <span>Saved to Dossier</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save to Dossier</span>
                </>
              )}
            </button>
          )}

          {/* Print Prescription Advice */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 hover:text-[#172B3A] transition-colors font-medium border border-transparent hover:border-slate-200"
            title="Print or export clean clinical advice note"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Advice</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
          <Stethoscope className="w-3 h-3 text-[#1769E0]" />
          <span>Dr. Ayesha Clinical Decision Support</span>
        </div>
      </div>
    </div>
  );
};
