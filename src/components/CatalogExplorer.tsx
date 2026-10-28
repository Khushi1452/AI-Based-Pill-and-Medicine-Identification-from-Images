import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, ArrowUpRight, RotateCcw, Pill, Sparkles, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import type { CatalogVariant, CatalogStats } from '../types/medicine';

interface CatalogExplorerProps {
  stats: CatalogStats | null;
  onSelectVariantForInspection: (variant: CatalogVariant) => void;
}

const FILTER_FORMS = [
  'ALL',
  'Tablet',
  'Capsule',
  'Syrup',
  'Gel',
  'Cream',
  'Injection',
  'Inhaler',
  'Rotacap',
  'Eye Drops',
];

const POPULAR_SEARCHES = ['Allegra', 'Augmentin', 'Paracip', 'Glycomet', 'Pantocid', 'Shelcal'];

export const CatalogExplorer: React.FC<CatalogExplorerProps> = ({
  stats,
  onSelectVariantForInspection,
}) => {
  const [query, setQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState('ALL');
  const [results, setResults] = useState<CatalogVariant[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCatalog = useCallback(async (q: string, form: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q,
        form,
        limit: '35',
      });
      const res = await fetch(`/api/catalog/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // Ignore transient network errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalog(query, selectedForm);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, selectedForm, fetchCatalog]);

  return (
    <section id="catalog" className="bg-white border border-[#E2EAF1] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Top Header & Metrics Banner */}
      <div className="p-6 sm:p-8 border-b border-[#E2EAF1] bg-gradient-to-b from-[#F6FAFD]/80 via-white to-white space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF3FF] text-[#1769E0] border border-[#1769E0]/20 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#1769E0] animate-pulse" />
              <Database className="w-3.5 h-3.5" />
              <span>Grounded Medicine Reference Database</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#172B3A] tracking-tight">
              20,400+ Indian Pharmaceutical Knowledge Graph
            </h2>
            <p className="text-sm text-[#647789] leading-relaxed">
              Every formulation across Set 1 &amp; Set 2 is indexed with verified active salts, dosage forms, therapeutic classifications, and Schedule H prescription rules. Click any row to load into the AI scanner.
            </p>
          </div>

          {/* Mini Stats Cards */}
          {stats && (
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="p-3.5 rounded-2xl bg-white border border-[#E2EAF1] shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-[#647789] font-medium">
                  <Pill className="w-3.5 h-3.5 text-[#1769E0]" />
                  <span>Products</span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#1769E0] tabular-nums mt-0.5">
                  {stats.totalProductVariants.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E2EAF1] shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-[#647789] font-medium">
                  <Database className="w-3.5 h-3.5 text-[#172B3A]" />
                  <span>Brands</span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#172B3A] tabular-nums mt-0.5">
                  {stats.totalBrandFamilies.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#E2EAF1] shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs text-[#647789] font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#18A999]" />
                  <span>Classes</span>
                </div>
                <div className="text-lg sm:text-xl font-bold font-mono text-[#18A999] tabular-nums mt-0.5">
                  {Object.keys(stats.therapeuticSectionCounts || {}).length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search & Dosage Form Filter Controls */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#647789] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Indian brand or salt (e.g., Allegra, Augmentin, Paracip, Glycomet, Udiliv, Pantocid)..."
                className="w-full pl-11 pr-24 py-3 text-sm bg-white border border-[#E2EAF1] rounded-2xl text-[#172B3A] placeholder:text-[#647789] focus:outline-none focus:border-[#1769E0] focus:ring-4 focus:ring-[#1769E0]/10 shadow-2xs transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[#647789] hover:text-[#172B3A] px-2.5 py-1 rounded-lg bg-[#F6FAFD] hover:bg-slate-100 border border-[#E2EAF1] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Live Count Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F6FAFD] border border-[#E2EAF1] text-xs font-mono text-[#647789] shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#18A999]" />
              <span>{results.length} matches indexed</span>
            </div>
          </div>

          {/* Filter Pills & Quick Search Hints */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-1.5 p-1 bg-[#F6FAFD] rounded-xl border border-[#E2EAF1] overflow-x-auto scrollbar-none">
              <div className="px-2.5 py-1 text-[11px] font-bold text-[#647789] uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" />
                <span>Form:</span>
              </div>
              {FILTER_FORMS.map((form) => (
                <button
                  key={form}
                  type="button"
                  onClick={() => setSelectedForm(form)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                    selectedForm === form
                      ? 'bg-[#1769E0] text-white shadow-xs'
                      : 'text-[#647789] hover:text-[#172B3A] hover:bg-white'
                  }`}
                >
                  {form === 'ALL' ? 'All Forms' : form}
                </button>
              ))}
            </div>

            {/* Quick click suggestions */}
            <div className="flex items-center gap-1.5 text-xs text-[#647789] overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[11px] font-semibold text-slate-400">Quick:</span>
              {POPULAR_SEARCHES.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setQuery(brand)}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-[#EAF3FF] hover:text-[#1769E0] border border-[#E2EAF1] text-[11px] font-medium transition-colors whitespace-nowrap"
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto max-h-[480px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#E2EAF1] z-10 shadow-2xs">
            <tr className="text-[11px] font-bold text-[#647789] tracking-wider uppercase">
              <th className="py-3 px-6">Brand Family</th>
              <th className="py-3 px-6">Product Line</th>
              <th className="py-3 px-6">Active Salts (Composition)</th>
              <th className="py-3 px-6">Therapeutic Class</th>
              <th className="py-3 px-6 text-right">Strength / Pack</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2EAF1] text-xs">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="h-14">
                  <td className="px-6 py-3.5" colSpan={6}>
                    <div className="h-5 bg-gradient-to-r from-[#EAF3FF] via-[#F6FAFD] to-[#EAF3FF] rounded-lg animate-pulse w-full" />
                  </td>
                </tr>
              ))
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 px-6 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#EAF3FF] text-[#1769E0] mx-auto flex items-center justify-center">
                      <Search className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-[#172B3A]">
                      No matching medicine entries found
                    </div>
                    <p className="text-xs text-[#647789] leading-relaxed">
                      No results for &ldquo;{query}&rdquo; with form filter &ldquo;{selectedForm}&rdquo;.
                      Try clicking one of the popular Indian brands below:
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                      {POPULAR_SEARCHES.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => setQuery(brand)}
                          className="px-2.5 py-1 rounded-lg bg-[#F6FAFD] hover:bg-[#EAF3FF] hover:text-[#1769E0] border border-[#E2EAF1] text-xs font-semibold text-[#172B3A] transition-colors"
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              results.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#F6FAFD]/80 hover:border-l-4 hover:border-l-[#1769E0] transition-all group h-14"
                >
                  <td className="py-3.5 px-6 font-bold text-[#172B3A] whitespace-nowrap">
                    <span className="group-hover:text-[#1769E0] transition-colors">{item.brandFamily}</span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-[#172B3A] whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#F6FAFD] border border-[#E2EAF1] text-[11px]">
                      {item.productLine}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 max-w-[280px]">
                    {item.inferredSalts && item.inferredSalts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.inferredSalts.map((salt, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-block px-2 py-0.5 rounded-md bg-[#EAF3FF] text-[#1769E0] font-mono text-[11px] font-medium border border-[#1769E0]/15"
                          >
                            {salt}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Physical label check</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-[#647789] max-w-[240px] truncate hindi-text">
                    {item.therapeuticClass}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono tabular-nums text-[#647789] whitespace-nowrap">
                    {[item.strength, item.packSize].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="py-3.5 px-6 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectVariantForInspection(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1769E0] bg-[#EAF3FF] hover:bg-[#1769E0] hover:text-white rounded-xl transition-all shadow-2xs group-hover:shadow-xs active:scale-95"
                    >
                      <span>Analyze</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
