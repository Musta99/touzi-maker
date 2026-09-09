import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";
import "../globals.css";

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
});

export const metadata: Metadata = {
  title: "Touzi Maker",
  description: "Modern building collection and Tobruk management system.",
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { children } = props;
  const { locale } = await props.params;
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <html lang={locale} className="h-full">
      <body className={`${hindSiliguri.variable} font-sans antialiased h-full bg-background`}>
        <TranslationProvider locale={locale as "en" | "bn"}>
          {children}
        </TranslationProvider>
      </body>
    </html>
  );
}
