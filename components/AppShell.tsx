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
  const [collapsed, setCollapsed] = useState(false); // 데스크탑 접기
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 드로어
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

  const BrandMark = (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-on-primary/10 ring-1 ring-on-primary/15">
      <span className="material-symbols-outlined text-[20px] text-on-primary">
        cottage
      </span>
    </span>
  );

  return (
    <div className="flex min-h-screen bg-surface text-on-background">
      {/* ─── 모바일 상단바 ─── */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 bg-[#57462f] px-4 py-3 text-on-primary md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-full p-1.5 text-on-primary/80 transition-colors hover:bg-on-primary/10"
          aria-label="메뉴 열기"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        {BrandMark}
        <span className="font-headline-md text-lg font-medium tracking-tight">
          우리집
        </span>
      </header>

      {/* ─── 모바일 오버레이 ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ─── 사이드바 (딥 파인) ─── */}
      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-[280px] flex-col justify-between overflow-hidden bg-[#57462f] px-4 py-8 text-on-primary transition-transform duration-300 md:transition-[width,transform] ${
          collapsed ? "md:w-20" : "md:w-[280px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="min-w-0">
          <div
            className={`mb-12 flex items-center ${
              collapsed ? "md:justify-center" : "justify-between px-1"
            }`}
          >
            {(!collapsed || mobileOpen) && (
              <span className="flex min-w-0 items-center gap-2.5 md:flex">
                {BrandMark}
                <span className="whitespace-nowrap font-headline-lg text-2xl font-medium tracking-tight text-on-primary">
                  우리집
                </span>
              </span>
            )}
            {collapsed && !mobileOpen && (
              <span className="hidden md:block">{BrandMark}</span>
            )}
            {/* 데스크탑: 접기 토글 */}
            <button
              className="hidden shrink-0 rounded-full p-2 text-on-primary/70 transition-colors hover:bg-on-primary/10 hover:text-on-primary md:block"
              onClick={() => setCollapsed((c) => !c)}
              title="사이드바 토글"
            >
              <span className="material-symbols-outlined">
                {collapsed ? "menu" : "menu_open"}
              </span>
            </button>
            {/* 모바일: 닫기 */}
            <button
              className="shrink-0 rounded-full p-2 text-on-primary/70 transition-colors hover:bg-on-primary/10 md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="메뉴 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {(!collapsed || mobileOpen) && (
            <p className="mb-4 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-on-primary/45">
              리모델링 보드
            </p>
          )}

          <nav className="flex flex-col gap-1.5">
            {items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-label-md font-label-md transition-all duration-200 ${
                    collapsed && !mobileOpen ? "md:justify-center md:px-0" : ""
                  } ${
                    active
                      ? "bg-on-primary/12 text-on-primary"
                      : "text-on-primary/65 hover:bg-on-primary/8 hover:text-on-primary"
                  }`}
                >
                  {active && (!collapsed || mobileOpen) && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--ochre)]" />
                  )}
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={
                      active ? { fontVariationSettings: "'FILL' 1" } : undefined
                    }
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`whitespace-nowrap ${
                      collapsed && !mobileOpen ? "md:hidden" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 하단: 로그인 상태 */}
        <div
          className={`flex items-center gap-3 border-t border-on-primary/12 pt-6 ${
            collapsed && !mobileOpen ? "md:justify-center md:px-0" : "justify-between px-2"
          }`}
        >
          {isAdmin ? (
            <>
              <div className={`min-w-0 ${collapsed && !mobileOpen ? "md:hidden" : ""}`}>
                <p className="truncate text-caption text-on-primary/60">
                  {adminEmail ?? "관리자"}
                </p>
                <button
                  onClick={logout}
                  className="text-label-md text-on-primary hover:underline"
                >
                  로그아웃
                </button>
              </div>
              <span className="material-symbols-outlined shrink-0 text-on-primary/80">
                admin_panel_settings
              </span>
            </>
          ) : (
            <Link
              href="/login"
              title="관리자 로그인"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 text-label-md text-on-primary/65 transition-colors hover:text-on-primary"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              <span className={collapsed && !mobileOpen ? "md:hidden" : ""}>
                관리자 로그인
              </span>
            </Link>
          )}
        </div>
      </aside>

      {/* ─── 메인 ─── */}
      <div
        className={`flex min-h-screen flex-1 flex-col pt-14 transition-[margin] duration-300 md:pt-0 ${
          collapsed ? "md:ml-20" : "md:ml-[280px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
