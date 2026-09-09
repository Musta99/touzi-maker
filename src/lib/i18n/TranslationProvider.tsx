"use client";

import React, { createContext, useContext, ReactNode } from "react";
import en from "@/messages/en.json";
import bn from "@/messages/bn.json";

type Messages = typeof en;
type Locale = "en" | "bn";

const messages: Record<Locale, Messages> = { en, bn };

const TranslationContext = createContext<{ locale: Locale; t: (key: string) => string }>({
  locale: "en",
  t: (key: string) => key,
});

export function TranslationProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  function t(key: string): string {
    const parts = key.split(".");
    let result: any = messages[locale] ?? messages["en"];
    for (const part of parts) {
      result = result?.[part];
      if (result === undefined) return key;
    }
    return typeof result === "string" ? result : key;
  }

  return (
    <TranslationContext.Provider value={{ locale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useT() {
  return useContext(TranslationContext);
}

export function useLocale() {
  return useContext(TranslationContext).locale;
}
