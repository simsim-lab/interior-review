import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ProtectionLayer from "@/components/ProtectionLayer";
import AppShell from "@/components/AppShell";
import { isAdmin, getAdminEmail } from "@/lib/auth";

export const metadata: Metadata = {
  title: "우리집 리모델링 — 인테리어 요구사항 보드",
  description: "공간별 현재상태·요구사항 정리 및 업체 미팅 준비",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await isAdmin();
  const email = admin ? await getAdminEmail() : null;

  return (
    <html lang="ko">
      <body>
        <ProtectionLayer />
        <AppShell isAdmin={admin} adminEmail={email}>
          {children}
        </AppShell>
        <Analytics />
      </body>
    </html>
  );
}
