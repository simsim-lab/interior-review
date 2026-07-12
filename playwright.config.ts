import { defineConfig, devices } from "@playwright/test";

// E2E 는 seed 모드(Supabase 미연결) + dev 서버로 실행 — 결정론적·Supabase 불필요.
// dev-bypass(NEXT_PUBLIC_ADMIN_DEV_BYPASS)는 NODE_ENV≠production 에서만 동작하므로
// `next start`(prod) 가 아닌 `next dev` 를 쓴다. 접근제어를 양방향으로 검증하기 위해
// bypass OFF(공개/차단) · ON(admin) 두 서버를 포트로 분리한다.
const CI = !!process.env.CI;
const PUBLIC_PORT = 3100; // bypass OFF
const ADMIN_PORT = 3101; // bypass ON

// 로컬 .env.local 의 Supabase 키를 무시하고 seed 모드 강제.
const SEED_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { ...devices["Desktop Chrome"], trace: "on-first-retry" },
  webServer: [
    {
      command: `npx next dev -p ${PUBLIC_PORT}`,
      url: `http://localhost:${PUBLIC_PORT}/current-state`,
      timeout: 120_000,
      reuseExistingServer: !CI,
      env: {
        ...SEED_ENV,
        NEXT_PUBLIC_ADMIN_DEV_BYPASS: "0",
        NEXT_DIST_DIR: ".next-e2e-public",
      },
    },
    {
      command: `npx next dev -p ${ADMIN_PORT}`,
      url: `http://localhost:${ADMIN_PORT}/current-state`,
      timeout: 120_000,
      reuseExistingServer: !CI,
      env: {
        ...SEED_ENV,
        NEXT_PUBLIC_ADMIN_DEV_BYPASS: "1",
        NEXT_DIST_DIR: ".next-e2e-admin",
      },
    },
  ],
  projects: [
    {
      name: "public", // bypass OFF — 공개 페이지 + 접근 차단
      use: { baseURL: `http://localhost:${PUBLIC_PORT}` },
      testMatch: /(routing|public-pages|checklist-access|loading)\.spec\.ts/,
    },
    {
      name: "admin", // bypass ON — 관리자 화면/편집 (lightbox 는 사진 업로드가 admin 전용)
      use: { baseURL: `http://localhost:${ADMIN_PORT}` },
      testMatch: /(admin-checklist|admin-editing|lightbox)\.spec\.ts/,
    },
  ],
});
