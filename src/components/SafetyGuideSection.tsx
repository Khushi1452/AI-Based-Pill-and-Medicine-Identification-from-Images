import React from 'react';
import {
  ShieldAlert,
  Stethoscope,
  CalendarCheck,
  AlertTriangle,
  FileCheck,
  Info,
  ShieldCheck,
} from 'lucide-react';

import type { LanguageMode } from '../types/medicine';

interface SafetyGuideProps {
  currentLanguage: LanguageMode;
}

export const SafetyGuideSection: React.FC<SafetyGuideProps> = ({ currentLanguage }) => {
  const safetyCards = [
    {
      icon: ShieldAlert,
      titleEn: 'Verify the Medicine',
      titleHi: 'दवा का सत्यापन करें',
      descEn: 'AI visual identification is an educational tool, not definitive proof of chemical authenticity, sterility, or product safety.',
      descHi: 'AI द्वारा पहचान केवल सहायक शैक्षिक उपकरण है; यह दवा की रासायनिक शुद्धता या प्रामाणिकता का कानूनी प्रमाण नहीं है।',
      tagEn: 'Educational Tool',
      tagHi: 'शैक्षिक साधन',
      accentColor: 'text-[#1769E0] bg-[#EAF3FF]',
      borderColor: 'hover:border-[#1769E0]/40',
    },
    {
      icon: Stethoscope,
      titleEn: 'Follow Professional Advice',
      titleHi: 'डॉक्टर की सलाह का पालन करें',
      descEn: 'Always use prescription medicines (Schedule H/X) strictly according to the individualized instructions of a registered medical practitioner.',
      descHi: 'शेड्यूल H या नियंत्रित दवाओं का सेवन केवल पंजीकृत चिकित्सक (RMP) के परामर्श और निर्धारित खुराक के अनुसार ही करें।',
      tagEn: 'Prescription Caution',
      tagHi: 'पर्चे की अनिवार्यता',
      accentColor: 'text-[#C78319] bg-amber-50',
      borderColor: 'hover:border-amber-300',
    },
    {
      icon: CalendarCheck,
      titleEn: 'Check Packaging & Expiry',
      titleHi: 'एक्सपायरी डेट और सील की जांच करें',
      descEn: 'Always review the printed expiration date, batch code, intact foil seal, and storage condition instructions before taking any tablet or syrup.',
      descHi: 'दवा लेने से पहले पत्ते पर छपी अंतिम तिथि (EXP), बैच नंबर, सील की स्थिति और भंडारण तापमान की अवश्य जांच करें।',
      tagEn: 'Physical Check',
      tagHi: 'पैकेट जांच',
      accentColor: 'text-[#16865B] bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
    },
    {
      icon: AlertTriangle,
      titleEn: 'Do Not Guess on Loose Pills',
      titleHi: 'अस्पष्ट या खुली गोलियों पर अनुमान न लगाएं',
      descEn: 'If a medicine strip is torn, blurry, or missing composition details, never take it based on an AI guess. Consult your nearest pharmacist.',
      descHi: 'यदि गोली खुली है या लेबल फटा हुआ है, तो केवल अनुमान पर कभी दवा न खाएं। अपने नजदीकी फार्मासिस्ट को दिखाएं।',
      tagEn: 'Zero Guesswork',
      tagHi: 'अनुमान वर्जित',
      accentColor: 'text-[#C84747] bg-red-50',
      borderColor: 'hover:border-red-300',
    },
  ];

  return (
    <section id="safety-guide" className="py-24 bg-[#F6FAFD] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#18A999]" />
            <span>{currentLanguage === 'hi' ? 'रोगी सुरक्षा और दिशा-निर्देश' : 'Patient Safety Guidelines'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#172B3A] tracking-tight">
            {currentLanguage === 'hi' ? 'आपकी सुरक्षा सर्वोपरि है' : 'Your Safety Comes First'}
          </h2>
          <p className="text-base text-[#647789] leading-relaxed">
            {currentLanguage === 'hi'
              ? 'दवाओं का सही और सुरक्षित उपयोग जीवन रक्षक होता है। किसी भी स्वास्थ्य निर्णय से पहले इन चार मौलिक नियमों का ध्यान रखें।'
              : 'Medicines require strict precision. Review these four foundational safety principles before acting on any identified information.'}
          </p>
        </div>

        {/* 4 Safety Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {safetyCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl border border-[#E2EAF1] p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${card.borderColor}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.accentColor} shadow-2xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F6FAFD] text-[#647789] border border-[#E2EAF1]">
                      {currentLanguage === 'hi' ? card.tagHi : card.tagEn}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-bold text-[#172B3A]">
                    {currentLanguage === 'hi' ? card.titleHi : card.titleEn}
                  </h3>

                  <p className="text-sm text-[#647789] leading-relaxed">
                    {currentLanguage === 'hi' ? card.descHi : card.descEn}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-[#16865B] font-semibold">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>{currentLanguage === 'hi' ? 'सत्यापित सुरक्षा प्रोटोकॉल' : 'Clinical Principle'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Educational Disclaimer Banner */}
        <div className="mt-14 bg-white rounded-2xl border border-[#1769E0]/25 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EAF3FF] to-[#D5E6FF] text-[#1769E0] flex items-center justify-center shrink-0 shadow-inner">
            <Info className="w-7 h-7 text-[#1769E0]" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-base font-bold text-[#172B3A]">
              {currentLanguage === 'hi' ? 'महत्वपूर्ण विधिक एवं चिकित्सीय अस्वीकरण' : 'Important Medical & Educational Disclaimer'}
            </h4>
            <p className="text-sm text-[#647789] leading-relaxed">
              {currentLanguage === 'hi'
                ? 'यह वेबसाइट केवल शैक्षिक और सूचनात्मक उद्देश्यों के लिए विकसित की गई है। यह किसी भी चिकित्सक, डॉक्टर या पंजीकृत फार्मासिस्ट की प्रत्यक्ष सलाह, निदान अथवा व्यक्तिगत उपचार योजना का विकल्प नहीं है। किसी भी दवा को शुरू करने या बदलने से पहले हमेशा डॉक्टर से मिलें।'
                : 'This platform provides educational information and does not replace professional medical advice, personalized diagnosis, or prescription management. Always consult a qualified physician or pharmacist before starting, stopping, or altering any medication schedule.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
