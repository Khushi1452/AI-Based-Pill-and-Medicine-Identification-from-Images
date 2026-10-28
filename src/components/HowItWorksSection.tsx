import React from 'react';
import { Camera, Cpu, BookOpen, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

import type { LanguageMode } from '../types/medicine';

interface HowItWorksProps {
  currentLanguage: LanguageMode;
  onGetStarted: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksProps> = ({
  currentLanguage,
  onGetStarted,
}) => {
  const steps = [
    {
      number: '01',
      icon: Camera,
      titleEn: 'Upload a Photo',
      titleHi: 'दवा का फोटो अपलोड करें',
      descEn: 'Take a clear picture of the medicine packaging, box, strip, or syrup bottle label.',
      descHi: 'दवा के पत्ते (Strip), डिब्बे, शीशी या ट्यूब के लेबल की साफ और सीधी तस्वीर लें।',
      tipEn: 'Ensure brand name and strength are visible without flash glare.',
      tipHi: 'दवा का नाम और मात्रा बिना परछाई या चमक के साफ दिखनी चाहिए।',
      color: 'from-[#1769E0] to-[#1255B8]',
    },
    {
      number: '02',
      icon: Cpu,
      titleEn: 'AI Reads the Label',
      titleHi: 'AI लेबल और सामग्री पढ़ता है',
      descEn: 'The system examines visible text, extracts active ingredients, and cross-references our 20,400+ Indian medicine catalog.',
      descHi: 'सिस्टम पैकेजिंग पर लिखे अक्षरों को स्कैन करके 20,400+ दवाओं के डेटाबेस से मिलान करता है।',
      tipEn: 'Identifies brand name, salts, formulation form, and Schedule H status.',
      tipHi: 'ब्रांड, सक्रिय साल्ट, फॉर्म और डॉक्टर के पर्चे (Rx) की अनिवार्यता का सत्यापन।',
      color: 'from-[#18A999] to-[#148B7D]',
    },
    {
      number: '03',
      icon: BookOpen,
      titleEn: 'Understand the Results',
      titleHi: 'हिंदी में पूरी जानकारी समझें',
      descEn: 'Review the identified details, primary therapeutic uses, critical precautions, and pharmacist guidance in simple Hindi.',
      descHi: 'पहचाने गए घटकों, मुख्य उपयोग, सावधानियों और डॉक्टर परामर्श संदेश को सरल हिंदी में पढ़ें।',
      tipEn: 'Educational guidance to empower safer health conversations.',
      tipHi: 'दवा की सही समझ के लिए शैक्षिक जानकारी; डॉक्टर की सलाह का विकल्प नहीं।',
      color: 'from-[#1769E0] to-[#18A999]',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white border-y border-[#E2EAF1] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#1769E0]/05 to-[#18A999]/05 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#18A999]" />
            <span>{currentLanguage === 'hi' ? 'सरल 3-चरणीय प्रक्रिया' : 'Simple 3-Step Workflow'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#172B3A] tracking-tight">
            {currentLanguage === 'hi' ? 'दवा पहचान कैसे काम करती है?' : 'How Medicine Identification Works'}
          </h2>
          <p className="text-base text-[#647789] leading-relaxed">
            {currentLanguage === 'hi'
              ? 'अत्याधुनिक कंप्यूटर विजन और भारतीय फार्मास्युटिकल डेटाबेस द्वारा संचालित, जो कुछ ही सेकंडों में स्पष्ट जानकारी प्रदान करता है।'
              : 'Powered by advanced vision AI and grounded in over 20,400 verified Indian medicine formulations for reliable, structured healthcare literacy.'}
          </p>
        </div>

        {/* 3 Step Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="clinical-card p-8 flex flex-col justify-between relative group hover:border-[#1769E0]/40 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Step Number Accent Badge */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} text-white flex items-center justify-center group-hover:scale-105 transition-all shadow-md shadow-[#1769E0]/15`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="font-mono font-extrabold text-4xl text-slate-100 group-hover:text-[#1769E0]/20 transition-colors select-none">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-display font-bold text-[#172B3A] group-hover:text-[#1769E0] transition-colors">
                    {currentLanguage === 'hi' ? step.titleHi : step.titleEn}
                  </h3>
                  <p className="text-sm text-[#647789] leading-relaxed">
                    {currentLanguage === 'hi' ? step.descHi : step.descEn}
                  </p>
                </div>

                {/* Footnote pill */}
                <div className="mt-6 pt-4 border-t border-[#E2EAF1] text-xs text-[#1769E0] flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#18A999] shrink-0" />
                  <span className="leading-snug">{currentLanguage === 'hi' ? step.tipHi : step.tipEn}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA & Safety Reassurance */}
        <div className="mt-14 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={onGetStarted}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-[#1769E0] to-[#1255B8] hover:from-[#1255B8] hover:to-[#0E4598] text-white text-sm font-bold rounded-xl shadow-md shadow-[#1769E0]/20 hover:shadow-lg hover:shadow-[#1769E0]/30 transition-all active:scale-[0.98]"
          >
            <span>{currentLanguage === 'hi' ? 'अभी दवा स्कैन करें' : 'Scan a Medicine Now'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-2 text-xs text-[#647789] bg-[#F6FAFD] px-4 py-3 rounded-xl border border-[#E2EAF1]">
            <ShieldCheck className="w-4 h-4 text-[#18A999] shrink-0" />
            <span>
              {currentLanguage === 'hi'
                ? 'सुरक्षा प्रथम: अस्पष्ट पैकेजिंग होने पर हम अनुमान लगाने के बजाय फार्मासिस्ट से पूछने की सलाह देते हैं।'
                : 'Safety-first: If packaging is blurry or unreadable, the AI withholds identification to protect you.'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
