"use client";

import { useT } from "@/lib/i18n/TranslationProvider";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { use, useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  LogOut,
  Receipt,
  Gift,
  PieChart,
  Menu,
  X,
} from "lucide-react";

export default function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { children } = props;
  const { locale } = use(props.params);
  const { t } = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const navigation = [
    { name: t("Common.dashboard"), href: `/${locale}`, icon: LayoutDashboard },
    { name: t("Common.buildings"), href: `/${locale}/buildings`, icon: Building2 },
    { name: t("Common.families"), href: `/${locale}/families`, icon: Users },
    { name: t("Common.collection"), href: `/${locale}/collection`, icon: FileText },
    { name: t("Common.receipts"), href: `/${locale}/receipts`, icon: Receipt },
    { name: t("Common.tobruk"), href: `/${locale}/tobruk`, icon: Gift },
    { name: t("Common.reports"), href: `/${locale}/reports`, icon: PieChart },
    { name: t("Common.settings"), href: `/${locale}/settings`, icon: Settings },
  ];

  const bottomNavItems = navigation.slice(0, 5);
  const moreNavItems = navigation.slice(5); // tobruk, reports, settings

  const handleLanguageSwitch = () => {
    const nextLocale = locale === "en" ? "bn" : "en";
    const currentPathWithoutLocale = pathname.replace(`/${locale}`, "");
    router.push(`/${nextLocale}${currentPathWithoutLocale}`);
  };

  const isMoreActive = moreNavItems.some(
    (item) =>
      pathname === item.href ||
      (item.href !== `/${locale}` && pathname.startsWith(item.href))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-xl font-bold text-primary">Touzi Maker</span>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== `/${locale}` &&
                    pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? "bg-green-50 dark:bg-green-900/20 text-primary dark:text-green-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    } group flex items-center px-2 py-2.5 text-sm font-medium rounded-md transition-colors`}
                  >
                    <item.icon
                      className={`${
                        isActive
                          ? "text-primary dark:text-green-400"
                          : "text-gray-400 dark:text-gray-500"
                      } mr-3 flex-shrink-0 h-5 w-5`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex flex-col border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <button
              onClick={handleLanguageSwitch}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {locale === "en" ? "বাংলা সংস্করণ" : "English Version"}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
              {t("Common.logout")}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 md:hidden flex-shrink-0 flex h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">Touzi Maker</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLanguageSwitch}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-md"
            >
              {locale === "en" ? "বাংলা" : "EN"}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
              className="p-2 text-gray-400 hover:text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around py-2">
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== `/${locale}` && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center px-2 py-1 ${
                  isActive ? "text-primary" : "text-gray-400"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-0.5">{item.name.split(" ")[0]}</span>
              </Link>
            );
          })}

          {/* More / Hamburger Button */}
          <button
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center px-2 py-1 ${
              moreOpen || isMoreActive ? "text-primary" : "text-gray-400"
            }`}
          >
            {moreOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="text-xs mt-0.5">{moreOpen ? t("Common.close") ?? "Close" : "More"}</span>
          </button>
        </nav>

        {/* Mobile More Drawer */}
        {moreOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm"
              onClick={() => setMoreOpen(false)}
            />
            {/* Slide-up panel */}
            <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 rounded-t-2xl shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  More
                </span>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="px-4 pb-6 space-y-1">
                {moreNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== `/${locale}` &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-green-50 dark:bg-green-900/20 text-primary dark:text-green-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          isActive
                            ? "text-primary dark:text-green-400"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}

        <main className="flex-1 pb-20 md:pb-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
