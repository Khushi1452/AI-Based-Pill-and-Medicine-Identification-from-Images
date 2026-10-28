import React, { useState } from 'react';
import { ChevronDown, HelpCircle, PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';

import type { LanguageMode } from '../types/medicine';

interface FAQSectionProps {
  currentLanguage: LanguageMode;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ currentLanguage }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Vision & OCR',
      categoryHi: 'कंप्यूटर विज़न',
      qEn: 'How does medicine identification work?',
      qHi: 'दवा की पहचान कैसे काम करती है?',
      aEn: 'The system uses computer vision and optical character recognition (OCR) to inspect visible text, brand titles, strengths, and formulation types printed on Indian medicine packaging. It then cross-references this data with our indexed knowledge base of over 20,400 Indian pharmaceutical formulations and verified calibration rules.',
      aHi: 'यह प्रणाली कंप्यूटर विज़न और ऑप्टिकल कैरेक्टर रिकॉग्निशन (OCR) द्वारा दवा के पैकेट पर छपे ब्रांड नाम, साल्ट और मात्रा को स्कैन करती है। इसके बाद 20,400 से अधिक भारतीय दवाओं के डेटाबेस से मिलान करके सटीक विवरण प्रस्तुत करती है।',
    },
    {
      category: 'Image Formats',
      categoryHi: 'फोटो प्रारूप',
      qEn: 'Which image formats are supported?',
      qHi: 'कौन से फोटो फॉर्मेट समर्थित हैं?',
      aEn: 'We support standard mobile and desktop photo formats: JPEG, JPG, PNG, and WEBP up to 25MB. You can upload an existing photo from your gallery, or capture a live photo directly using your device camera.',
      aHi: 'आप अपने फोन या कंप्यूटर से JPG, JPEG, PNG और WEBP प्रारूप में 25MB तक की फोटो अपलोड कर सकते हैं। इसके अलावा लाइव कैमरा से सीधे फोटो खींचने की सुविधा भी उपलब्ध है।',
    },
    {
      category: 'Safety Protocol',
      categoryHi: 'सुरक्षा नियम',
      qEn: 'What happens if the medicine cannot be identified?',
      qHi: 'यदि दवा की पहचान न हो पाए तो क्या होता है?',
      aEn: 'Safety is our absolute priority. If a packaging image is blurry, torn, suffering from flash glare, or obscured, the AI safely withholds identification (is_identified = false). It explains the specific reason and guides you to consult a licensed pharmacist rather than guessing.',
      aHi: 'मरीजों की सुरक्षा के लिए, यदि फोटो धुंधली हो, पत्ता फटा हो या चमक के कारण नाम न दिखे, तो सिस्टम गलत अनुमान लगाने के बजाय पहचान रोक देता है (is_identified = false) और फार्मासिस्ट से पूछने की सलाह देता है।',
    },
    {
      category: 'Clinical Scope',
      categoryHi: 'चिकित्सीय दायरा',
      qEn: 'Does this website prescribe medicines or advise dosage?',
      qHi: 'क्या यह वेबसाइट दवा लिखती है या खुराक तय करती है?',
      aEn: 'Strictly NO. This platform is an educational assistant designed to help patients understand what active salts are in their medication and their general therapeutic purpose. It never prescribes medications, alters dosages, or suggests individualized treatment durations.',
      aHi: 'बिल्कुल नहीं। यह वेबसाइट केवल एक शैक्षिक सहायक है जो आपको दवा के साल्ट और उसके सामान्य उपयोग को समझने में मदद करती है। यह कभी भी कोई व्यक्तिगत खुराक या इलाज तय नहीं करती।',
    },
    {
      category: 'Loose Pills',
      categoryHi: 'खुली गोलियां',
      qEn: 'Can I identify a loose, unmarked tablet without packaging?',
      qHi: 'क्या बिना पैकेट की खुली या बिना निशान वाली गोली की पहचान हो सकती है?',
      aEn: 'No. Visual identification of unmarked loose round tablets without chemical testing is clinically unsafe and strictly rejected by our system. Hundreds of medications share identical round white shapes. Always inspect the printed strip or bottle foil.',
      aHi: 'नहीं। बिना पैकेट या बिना प्रिंट वाली सफेद गोलियों को केवल देखकर पहचानना चिकित्सकीय रूप से असुरक्षित है। सैकड़ों विभिन्न दवाएं एक जैसी दिख सकती हैं। हमेशा प्रिंटेड पत्ते या डिब्बे के साथ ही पहचान करें।',
    },
    {
      category: 'Privacy & Data',
      categoryHi: 'डेटा गोपनीयता',
      qEn: 'Is my uploaded image stored or shared?',
      qHi: 'क्या मेरी अपलोड की गई फोटो सर्वर पर स्टोर की जाती है?',
      aEn: 'No. Images are processed in-memory solely for optical character extraction and response generation. Uploaded image payloads are not archived into permanent databases or sold to third parties.',
      aHi: 'नहीं। आपकी तस्वीरें केवल तात्कालिक स्कैन और विवरण निकालने के लिए मेमोरी में प्रोसेस होती हैं। उन्हें किसी स्थायी डेटाबेस में स्टोर या किसी तीसरे पक्ष को साझा नहीं किया जाता।',
    },
    {
      category: 'Verification',
      categoryHi: 'सत्यापन',
      qEn: 'How should I verify the result before taking any medication?',
      qHi: 'दवा लेने से पहले मुझे परिणाम का सत्यापन कैसे करना चाहिए?',
      aEn: 'Always check the printed composition line on your physical medicine strip, verify the expiration date, and confirm your dosing schedule with your prescribing physician or a registered dispensing pharmacist.',
      aHi: 'हमेशा अपने हाथ में मौजूद दवा के पत्ते पर छपे नाम, एक्सपायरी डेट और अपने डॉक्टर द्वारा दिए गए पर्चे (Prescription) से मिलान करने के बाद ही दवा का सेवन करें।',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-gradient-to-b from-white via-[#F6FAFD]/40 to-white border-t border-[#E2EAF1] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#1769E0]/5 to-[#18A999]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-pulse" />
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{currentLanguage === 'hi' ? 'अक्सर पूछे जाने वाले सवाल' : 'Frequently Asked Questions'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#172B3A] tracking-tight">
            {currentLanguage === 'hi' ? 'सामान्य प्रश्न और उत्तर' : 'Clear Answers to Common Questions'}
          </h2>
          <p className="text-sm sm:text-base text-[#647789] max-w-2xl mx-auto leading-relaxed">
            {currentLanguage === 'hi'
              ? 'प्रौद्योगिकी, सटीकता और रोगी गोपनीयता से जुड़े आपके सभी प्रश्नों का पारदर्शी समाधान।'
              : 'Everything you need to know about our medicine vision AI, safety guardrails, and patient privacy.'}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#1769E0]/50 bg-white shadow-sm border-l-4 border-l-[#1769E0]'
                    : 'border-[#E2EAF1] bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#F6FAFD] text-[#647789] border border-[#E2EAF1] shrink-0">
                      {currentLanguage === 'hi' ? faq.categoryHi : faq.category}
                    </span>
                    <span className="font-display font-bold text-base sm:text-lg text-[#172B3A]">
                      {currentLanguage === 'hi' ? faq.qHi : faq.qEn}
                    </span>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      isOpen ? 'rotate-180 bg-[#1769E0] text-white shadow-2xs' : 'bg-[#EAF3FF] text-[#1769E0]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm sm:text-base text-[#647789] leading-relaxed border-t border-slate-100 bg-[#F6FAFD]/40">
                    <p className={currentLanguage === 'hi' ? 'hindi-text' : ''}>
                      {currentLanguage === 'hi' ? faq.aHi : faq.aEn}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Emergency Clinical Hotline Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#172B3A] via-[#12304A] to-[#172B3A] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center border border-white/10 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {currentLanguage === 'hi' ? 'तत्काल आपातकालीन चिकित्सा सहायता' : 'Emergency & Adverse Event Guidance'}
              </div>
              <div className="text-xs text-slate-300">
                {currentLanguage === 'hi'
                  ? 'अस्पताल एम्बुलेंस: 108 · राष्ट्रीय विष सूचना केंद्र (AIIMS): 1800-116-117'
                  : 'National Ambulance: 108 · National Poisons Information Centre (AIIMS New Delhi): 1800-116-117'}
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>24x7 Verified Indian Helplines</span>
          </div>
        </div>
      </div>
    </section>
  );
};
