import React from 'react';
import { ShieldCheck, Heart, Sparkles, ArrowUp, Lock, CheckCircle2 } from 'lucide-react';

import type { LanguageMode } from '../types/medicine';

interface FooterProps {
  currentLanguage: LanguageMode;
}

export const Footer: React.FC<FooterProps> = ({ currentLanguage }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white border-t border-[#E2EAF1] relative pt-16 pb-12 text-sm text-[#647789]">
      {/* Sleek Gradient Accent Line at the Top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1769E0]/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Column 1: Brand & Description */}
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#1769E0] to-[#18A999] p-0.5 shadow-sm">
                <div className="w-full h-full bg-[#0A1628] rounded-[14px] flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    <span className="w-5 h-1.5 bg-white rounded-xs absolute" />
                    <span className="w-1.5 h-5 bg-white rounded-xs absolute" />
                    <span className="w-2 h-2 rounded-full bg-[#18A999] absolute border border-[#0A1628]" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-xl tracking-tight text-[#172B3A]">
                  MediScan<span className="text-[#1769E0]">.AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#18A999]">
                  Aushadhi Drishti
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed max-w-md text-[#647789]">
              {currentLanguage === 'hi'
                ? 'भारतीय फार्मास्युटिकल पैकेजिंग पहचान, घटक विश्लेषण और रोगी सुरक्षा शिक्षा मंच। 20,400+ भारतीय दवाओं के ज्ञान आधार से संयोजित।'
                : 'AI-assisted Indian pharmaceutical packaging recognition, active salts extraction, and patient safety guidance grounded in 20,400+ verified formulations.'}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#18A999]" />
                <span>CDSCO &amp; Indian Pharmacopoeia Grounded</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#F6FAFD] text-[#647789] border border-[#E2EAF1] font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>100% In-Memory Vision</span>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
              {currentLanguage === 'hi' ? 'नेविगेशन' : 'Platform Navigation'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#hero" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'होम' : 'Home'}</span>
                </a>
              </li>
              <li>
                <a href="#scanner" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'दवा पहचानें' : 'Identify Medicine'}</span>
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'कार्यविधि' : 'How It Works'}</span>
                </a>
              </li>
              <li>
                <a href="#catalog" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'दवा डायरेक्टरी' : 'Medicine Catalog (20,400+)'}</span>
                </a>
              </li>
              <li>
                <a href="#accuracy-lab" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'एक्यूरेसी ट्रेनर लैब' : 'Accuracy Trainer Lab'}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Clinical & Safety Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172B3A]">
              {currentLanguage === 'hi' ? 'सुरक्षा और नीतियां' : 'Clinical & Safety'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#safety-guide" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'रोगी सुरक्षा गाइड' : 'Patient Safety Guide'}</span>
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-[#1769E0] transition-colors flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{currentLanguage === 'hi' ? 'सामान्य प्रश्न' : 'FAQ & Privacy'}</span>
                </a>
              </li>
              <li className="pt-2">
                <div className="p-3 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A999]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Non-Commercial Initiative</span>
                  </div>
                  <p className="text-[11px] text-[#647789] leading-tight">
                    Dedicated to reducing prescription confusion and improving health literacy across India.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Medical Disclaimer & Copyright */}
        <div className="pt-8 border-t border-[#E2EAF1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-center sm:text-left text-[#647789] max-w-2xl leading-relaxed">
            © {new Date().getFullYear()} MediScan AI · Aushadhi Drishti. All rights reserved.
            Strictly for informational and educational purposes. Not a substitute for professional clinical diagnosis or doctor consultation.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E2EAF1] hover:border-[#1769E0]/40 bg-white hover:bg-[#F6FAFD] text-[#172B3A] font-semibold transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5 text-[#1769E0] group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
};
