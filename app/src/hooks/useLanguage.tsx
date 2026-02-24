import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { detectLanguage, getTranslations, type Language } from '@/lib/i18n';

const LANGUAGE_STORAGE_KEY = 'tml-villa-language';

interface LanguageContextType {
  lang: Language;
  t: ReturnType<typeof getTranslations>;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [t, setT] = useState(getTranslations('en'));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    const initialLang = savedLang || detectLanguage();
    setLangState(initialLang);
    setT(getTranslations(initialLang));
  }, []);

  useEffect(() => {
    if (isClient) setT(getTranslations(lang));
  }, [lang, isClient]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, t, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
