"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient, SUPABASE_ENABLED } from "@/lib/supabase/client";

type NavItem = { href: string; label: string; icon: string; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/current-state", label: "현재상태", icon: "photo_library" },
  { href: "/requirements", label: "요구사항", icon: "architecture" },
  { href: "/checklist", label: "체크리스트", icon: "fact_check", adminOnly: true },
];

export default function AppShell({
  isAdmin,
  adminEmail,
  children,
}: {
  isAdmin: boolean;
  adminEmail: string | null;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  async function logout() {
    if (SUPABASE_ENABLED) {
      await createClient().auth.signOut();
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-surface text-on-background">
      {/* ─── 사이드바 ─── */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-[280px]"
        } bg-surface border-r border-outline-variant h-screen fixed top-0 left-0 flex flex-col justify-between py-8 px-4 z-50 overflow-hidden transition-[width] duration-300`}
      >
        <div className="min-w-0">
          <div
            className={`flex items-center mb-12 ${
              collapsed ? "justify-center" : "justify-between px-2"
            }`}
          >
            {!collapsed && (
              <span className="text-headline-lg font-headline-lg tracking-tighter text-primary whitespace-nowrap">
                우리집
              </span>
            )}
            <button
              className="text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-low shrink-0"
              onClick={() => setCollapsed((c) => !c)}
              title="사이드바 토글"
            >
              <span className="material-symbols-outlined">
                {collapsed ? "menu" : "menu_open"}
              </span>
            </button>
          </div>

          <nav className="flex flex-col gap-2">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-label-md font-label-md transition-colors duration-200 ${
                    collapsed ? "justify-center px-0" : ""
                  } ${
                    active
                      ? "bg-primary-container/10 text-primary font-bold"
                      : "text-secondary hover:bg-surface-container-low hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 하단: 로그인 상태 */}
        <div
          className={`border-t border-outline-variant pt-6 flex items-center gap-3 ${
            collapsed ? "justify-center" : "justify-between px-2"
          }`}
        >
          {isAdmin ? (
            <>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-caption text-secondary truncate">
                    {adminEmail ?? "관리자"}
                  </p>
                  <button
                    onClick={logout}
                    className="text-label-md text-primary hover:underline"
                  >
                    로그아웃
                  </button>
                </div>
              )}
              <span className="material-symbols-outlined text-primary shrink-0">
                admin_panel_settings
              </span>
            </>
          ) : (
            <Link
              href="/login"
              title="관리자 로그인"
              className={`flex items-center gap-2 text-secondary hover:text-primary transition-colors text-label-md ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              {!collapsed && <span>관리자 로그인</span>}
            </Link>
          )}
        </div>
      </aside>

      {/* ─── 메인 ─── */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-300 ${
          collapsed ? "ml-20" : "ml-[280px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
