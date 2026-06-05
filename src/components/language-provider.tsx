"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { dictionaries, type Language } from "@/lib/i18n";
import { getStoredLanguage, setStoredLanguage } from "@/lib/client/session";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (typeof dictionaries)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() =>
    typeof window === "undefined" ? "en" : getStoredLanguage(),
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "fa" ? "rtl" : "ltr";
    document.body.dataset.language = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        setStoredLanguage(nextLanguage);
        setLanguageState(nextLanguage);
      },
      t: dictionaries[language],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }
  return context;
};
