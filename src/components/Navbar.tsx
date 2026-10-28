import React, { useState } from 'react';
import {
  Menu,
  X,
  Globe,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import type { LanguageMode } from '../types/medicine';

interface NavbarProps {
  currentLanguage: LanguageMode;
  onToggleLanguage: () => void;
  onSelectLanguage?: (lang: LanguageMode) => void;
  onNavigateToUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLanguage,
  onToggleLanguage,
  onSelectLanguage,
  onNavigateToUpload,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    {
      label:
        currentLanguage === 'hi'
          ? 'होम'
          : currentLanguage === 'hinglish'
          ? 'Home'
          : 'Home',
      href: '#hero',
    },
    {
      label:
        currentLanguage === 'hi'
          ? 'डॉक्टर सेवा'
          : currentLanguage === 'hinglish'
          ? 'Doctor Care'
          : 'Doctor AI',
      href: '#doctor-portal',
    },
    {
      label:
        currentLanguage === 'hi'
          ? 'पहचानें'
          : currentLanguage === 'hinglish'
          ? 'Pehchanein'
          : 'Identify',
      href: '#scanner',
    },
    {
      label:
        currentLanguage === 'hi'
          ? 'दवा डायरेक्टरी'
          : currentLanguage === 'hinglish'
          ? 'Dawa Directory'
          : 'Medicine Catalog',
      href: '#catalog',
    },
    
    {
      label:
        currentLanguage === 'hi'
          ? 'सामान्य प्रश्न'
          : currentLanguage === 'hinglish'
          ? 'FAQ'
          : 'FAQ',
      href: '#faq',
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E2EAF1]/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Product Name */}
          <a
            href="#hero"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1769E0] rounded-xl p-1"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#1769E0] via-[#1255B8] to-[#18A999] flex items-center justify-center text-white shadow-sm shadow-[#1769E0]/25 group-hover:scale-105 transition-all">
              {/* Medical cross & shield emblem */}
              <div className="relative flex items-center justify-center">
                <span className="w-5 h-1.5 bg-white rounded-xs absolute" />
                <span className="w-1.5 h-5 bg-white rounded-xs absolute" />
                <span className="w-2 h-2 rounded-full bg-[#18A999] absolute border border-white" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-[#172B3A]">
                MediScan<span className="text-[#1769E0]">.AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20">
                <Sparkles className="w-2.5 h-2.5 text-[#18A999]" />
                <span>Clinical Vision</span>
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#647789] hover:text-[#1769E0] hover:bg-[#EAF3FF]/80 rounded-lg transition-all"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action Controls: 3-Language Segmented Switcher & Primary CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="inline-flex items-center p-0.5 bg-[#F6FAFD] rounded-xl border border-[#E2EAF1] shadow-2xs">
              <button
                type="button"
                onClick={() => (onSelectLanguage ? onSelectLanguage('en') : onToggleLanguage())}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentLanguage === 'en'
                    ? 'bg-[#1769E0] text-white shadow-xs'
                    : 'text-[#647789] hover:text-[#172B3A]'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => (onSelectLanguage ? onSelectLanguage('hinglish') : onToggleLanguage())}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentLanguage === 'hinglish'
                    ? 'bg-[#1769E0] text-white shadow-xs'
                    : 'text-[#647789] hover:text-[#172B3A]'
                }`}
                title="Hinglish (Roman Hindi)"
              >
                Hinglish
              </button>
              <button
                type="button"
                onClick={() => (onSelectLanguage ? onSelectLanguage('hi') : onToggleLanguage())}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentLanguage === 'hi'
                    ? 'bg-[#1769E0] text-white shadow-xs'
                    : 'text-[#647789] hover:text-[#172B3A]'
                }`}
                title="हिंदी (Devanagari)"
              >
                हिंदी
              </button>
            </div>

            <a
              href="tel:112"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C84747]/10 hover:bg-[#C84747]/20 border border-[#C84747]/30 text-[#C84747] text-xs font-bold transition-colors"
              title="National Emergency 112"
            >
              <span className="w-2 h-2 rounded-full bg-[#C84747] animate-ping" />
              <span>112 Help</span>
            </a>

            <button
              type="button"
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1769E0] to-[#1255B8] hover:from-[#1255B8] hover:to-[#0E4598] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#1769E0]/25 hover:shadow-md hover:shadow-[#1769E0]/30 active:scale-[0.98] transition-all"
            >
              <span>
                {currentLanguage === 'hi'
                  ? 'दवा पहचानें'
                  : currentLanguage === 'hinglish'
                  ? 'Dawa Scan Karein'
                  : 'Scan Medicine'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleLanguage}
              className="px-2.5 py-1 text-xs font-bold text-[#172B3A] bg-[#F6FAFD] border border-[#E2EAF1] rounded-lg"
              title="Toggle Language"
            >
              {currentLanguage === 'hi' ? 'हिंदी' : currentLanguage === 'hinglish' ? 'Hinglish' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#172B3A] hover:bg-[#F6FAFD] rounded-xl border border-[#E2EAF1] transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-[#E2EAF1] bg-white px-4 pt-3 pb-5 space-y-2 shadow-xl animate-fade-in">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-[#172B3A] hover:text-[#1769E0] hover:bg-[#EAF3FF] rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-2 border-t border-[#E2EAF1]">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateToUpload();
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#1769E0] to-[#1255B8] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <span>{currentLanguage === 'hi' ? 'दवा पहचानें' : 'Scan Medicine'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
