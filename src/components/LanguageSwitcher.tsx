'use client';

import { useLanguage, Language } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm font-medium"
      title={language === 'en' ? 'Switch to Japanese' : '英語に切り替え'}
    >
      <Globe className="h-4 w-4" />
      <span>{language === 'en' ? 'EN' : 'JP'}</span>
    </button>
  );
}

export function LanguageSwitcherDropdown() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white text-sm font-medium"
      >
        <Globe className="h-4 w-4" />
        <span>{language === 'en' ? 'EN' : 'JP'}</span>
      </button>

      <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <button
          onClick={() => setLanguage('en')}
          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 rounded-t-lg flex items-center gap-2 ${language === 'en' ? 'text-orange-600 font-semibold bg-orange-50' : 'text-slate-700'}`}
        >
          <span className="text-base">🇺🇸</span>
          English
        </button>
        <button
          onClick={() => setLanguage('ja')}
          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 rounded-b-lg flex items-center gap-2 ${language === 'ja' ? 'text-orange-600 font-semibold bg-orange-50' : 'text-slate-700'}`}
        >
          <span className="text-base">🇯🇵</span>
          日本語
        </button>
      </div>
    </div>
  );
}
