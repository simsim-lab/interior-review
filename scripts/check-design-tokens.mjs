#!/usr/bin/env node
// 디자인 토큰 가드 — 색은 반드시 tailwind 시맨틱 토큰으로. tsx 안 raw hex/arbitrary
// 색상 클래스를 금지해 "화면마다 미묘하게 다른 색"(드리프트)을 CI에서 원천 차단한다.
//
// 검사 대상: app/**, components/** 의 .tsx (JSX 마크업).
//   - tailwind.config.ts(토큰 정의부)·globals.css 는 대상 아님(색을 "정의"하는 곳).
// 위반 예:  className="bg-[#57462f]"  ·  style={{ color: "#6e4a17" }}
// 올바름:  className="bg-sidebar"      ·  color: "var(--ink)" / 토큰
//
// 예외가 정말 필요하면 그 줄에 `design-token-allow` 주석을 달면 건너뛴다.
//
// 의존성 없음(순수 node). CI lint 잡에서 `npm run lint:tokens` 로 실행.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["app", "components"];
const ALLOW_MARKER = "design-token-allow";

// 1) raw hex 리터럴 (#rgb / #rrggbb / #rrggbbaa) — 인라인 style·arbitrary 클래스 양쪽 모두 포착.
//    (bg-[#57462f] 안의 #57462f 도 여기서 걸린다.)
const RAW_HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;
// 2) arbitrary 색상-함수 유틸리티 클래스 (bg-[rgb(..)] 등). 인라인 style 의 rgba() 는
//    스크림 등에 정당하게 쓰이므로 건드리지 않는다 — 오직 "클래스 형태"만 금지.
const ARBITRARY_COLOR_FN =
  /-\[(?:rgb|rgba|hsl|hsla|color|oklch|oklab)\(/;

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; // 루트가 없으면 조용히 건너뜀
  }
  for (const name of entries) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".tsx")) out.push(p);
  }
  return out;
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      if (line.includes(ALLOW_MARKER)) return;
      const hex = line.match(RAW_HEX);
      const fn = line.match(ARBITRARY_COLOR_FN);
      if (hex) violations.push({ file, line: i + 1, token: hex[0], kind: "raw hex" });
      else if (fn)
        violations.push({ file, line: i + 1, token: fn[0], kind: "arbitrary color()" });
    });
  }
}

if (violations.length === 0) {
  console.log("✓ design tokens: tsx 에 raw 색상 하드코딩 없음");
  process.exit(0);
}

console.error(`\n✗ design tokens: raw 색상 하드코딩 ${violations.length}건 발견\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.kind}: ${v.token}`);
}
console.error(
  `\n색은 tailwind.config.ts 의 시맨틱 토큰으로 쓰세요 (예: bg-primary, text-on-surface).` +
    `\n토큰에 없는 색이면 tailwind.config.ts 에 새 토큰을 추가한 뒤 그 이름으로 참조하세요.` +
    `\n정당한 예외는 해당 줄에 \`${ALLOW_MARKER}\` 주석으로 명시적으로 허용할 수 있습니다.\n`,
);
process.exit(1);
