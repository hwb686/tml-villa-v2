import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { detectLanguage, getTranslations, type Language } from '@/lib/i18n';

interface LanguageContextType {
  lang: Language;
  t: ReturnType<typeof getTranslations>;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const [t, setT] = useState(getTranslations('en'));
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const detectedLang = detectLanguage();
    setLang(detectedLang);
    setT(getTranslations(detectedLang));
  }, []);

  useEffect(() => {
    if (isClient) setT(getTranslations(lang));
  }, [lang, isClient]);

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
