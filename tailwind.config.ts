import type { Config } from "tailwindcss";

// ─────────────────────────────────────────────────────────────────────────────
// "Warm Architectural Lookbook" 팔레트.
// AtelierSync 토큰 이름은 그대로 두되(컴포넌트 호환), 값만 따뜻한 종이/잉크/파인/오커
// 계열로 재해석했다. 색 이름 → 실제 색의 매핑만 바뀌므로 마크업 수정 없이 전체 톤 전환.
//   paper  #f3ede3   ink #221f1a   pine #26372c   ochre #8a5a22
// ─────────────────────────────────────────────────────────────────────────────
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── 중립: 크림 화이트 → 우드 잉크 ─────────────────
        background: "#f6f1e6",
        surface: "#f6f1e6",
        "surface-bright": "#fbf7ef",
        "surface-dim": "#eae1cf",
        "surface-container-lowest": "#fefcf7",
        "surface-container-low": "#f1e9d9",
        "surface-container": "#ede4d2",
        "surface-container-high": "#e6dcc6",
        "surface-container-highest": "#ddd0b6",
        "surface-variant": "#e6dcc6",
        "on-background": "#2a2016",
        "on-surface": "#2a2016",
        "on-surface-variant": "#574b3a",
        outline: "#ab9a7c",
        "outline-variant": "#ddd0ba",
        // ── Primary: 월넛 우드 (브랜드·버튼·강조·사이드바) ─
        primary: "#4a3a29",
        "on-primary": "#f7f1e6",
        "primary-container": "#4a3a29",
        "on-primary-container": "#5c4a36",
        "primary-fixed": "#e8d8bf",
        "primary-fixed-dim": "#d8c09b",
        "on-primary-fixed": "#2a1c0c",
        "on-primary-fixed-variant": "#5c4a36",
        "inverse-primary": "#e0c59b",
        "surface-tint": "#4a3a29",
        // ── Secondary: 뮤트 우드 토프 ─────────────────────
        secondary: "#7a6a52",
        "on-secondary": "#ffffff",
        "secondary-container": "#e6dcc6",
        "on-secondary-container": "#574b3a",
        "secondary-fixed": "#e6dcc6",
        "secondary-fixed-dim": "#cdbf9f",
        "on-secondary-fixed": "#2a2016",
        "on-secondary-fixed-variant": "#554836",
        // ── Tertiary: 캐러멜/앰버 우드 액센트 ─────────────
        tertiary: "#9a6a28",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#f0dcb8",
        "on-tertiary-container": "#6e4a17",
        "tertiary-fixed": "#f6e6c8",
        "tertiary-fixed-dim": "#e5cb9a",
        "on-tertiary-fixed": "#2e1e08",
        "on-tertiary-fixed-variant": "#6e4a17",
        // ── Inverse (다크 우드 서피스·라이트박스·토스트) ──
        "inverse-surface": "#38302a",
        "inverse-on-surface": "#f6f1e6",
        // ── Error: 따뜻한 벽돌 ────────────────────────────
        error: "#b23a2b",
        "on-error": "#ffffff",
        "error-container": "#f6d9d2",
        "on-error-container": "#5a1509",
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.625rem",
        xl: "1rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
      spacing: {
        unit: "8px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
        gutter: "24px",
        "container-max": "1440px",
      },
      maxWidth: {
        "container-max": "1440px",
      },
      fontFamily: {
        // 헤드라인 계열 = Fraunces(따뜻한 소프트 세리프), 본문/라벨 = Inter
        "display-lg": ["Fraunces", "ui-serif", "Georgia", "serif"],
        "headline-lg": ["Fraunces", "ui-serif", "Georgia", "serif"],
        "headline-lg-mobile": ["Fraunces", "ui-serif", "Georgia", "serif"],
        "headline-md": ["Fraunces", "ui-serif", "Georgia", "serif"],
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        caption: ["Inter", "sans-serif"],
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "1.55", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "headline-lg": ["34px", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "500" }],
        "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.04em", fontWeight: "600" }],
        "headline-lg-mobile": ["26px", { lineHeight: "1.15", fontWeight: "500" }],
        "headline-md": ["24px", { lineHeight: "1.25", fontWeight: "500" }],
        "display-lg": ["52px", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "500" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      boxShadow: {
        soft: "0 6px 24px -10px rgba(45, 33, 16, 0.16)",
        lift: "0 20px 44px -16px rgba(45, 33, 16, 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
