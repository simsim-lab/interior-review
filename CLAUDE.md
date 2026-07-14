# interior-review — 프로젝트 가이드

인테리어 업체 미팅 전에 admin이 요구사항/현재상태를 정리해 업체에게 웹으로 전달하는 앱.
스택: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase(Postgres+RLS) + Vercel.

---

## 디자인 거버넌스 (색은 토큰만)

이 앱의 디자인 시스템 = **"Warm Architectural Lookbook"**. 통일성은 규율이 아니라
**토큰으로 강제**한다. 새 UI를 만들거나 기존 UI를 고칠 때 아래를 지킨다.

### 단일 소스: 디자인 토큰

색·폰트·간격은 전부 `tailwind.config.ts`(+ `app/globals.css`)에 시맨틱 이름으로 정의돼 있다.
컴포넌트는 **이 이름만** 참조한다. 이름은 Material Design 3 관례를 따르고, 값은 룩북 팔레트다.

- **색**: `bg-primary` `text-on-surface` `bg-tertiary-container` `bg-sidebar` `text-error` …
- **폰트**: `font-display-lg` `font-headline-lg`(Fraunces 세리프) · `font-body-md` `font-label-md`(Inter)
- **간격/폭**: `px-margin-desktop` `gap-gutter` `max-w-container-max` …
- **그림자/모션**: `shadow-soft` `shadow-lift` · `.rise` `.hero-in` `.lift`(모두 `prefers-reduced-motion` 존중)

### 규칙

1. **색 raw 하드코딩 금지.** tsx 에 `#rrggbb` 리터럴이나 `bg-[#...]` 같은 arbitrary 색상
   클래스를 쓰지 않는다. → 색은 반드시 위 시맨틱 토큰으로.
   - 토큰에 **없는 색**이 필요하면 임의 hex 를 박지 말고 `tailwind.config.ts` 에 **새 토큰을
     추가**한 뒤 그 이름으로 참조한다. (예: 사이드바색 `#57462f` → `sidebar` 토큰으로 승격됨.)
   - 이 규칙은 CI 에서 `npm run lint:tokens`(scripts/check-design-tokens.mjs)로 **자동 강제**된다.
     위반하면 lint 잡이 깨진다. 정당한 예외는 해당 줄에 `design-token-allow` 주석으로 명시.
2. **공통 컴포넌트/클래스 재사용.** 폼 필드·칩·카드·히어로 등은 새로 만들지 말고 기존 것을 쓴다:
   - `Hero`(+`HeroChip`) — 페이지 상단 히어로 (SpaceView·ChecklistView 에서 사용)
   - globals.css 의 `.field` `.chip` `.chip-input` `.cell-edit` `.filter-head` `.space-select`
3. **arbitrary 사이즈(`text-[18px]`, `z-[200]`, `w-[280px]`)는 허용**하되 남용하지 않는다.
   반복되면 토큰(`fontSize`/`spacing`)으로 승격하는 걸 우선 고려한다.
4. **데스크탑 우선** 최적화. 모바일은 깨지지 않는 수준으로 대응.

### 알려진 기술부채

- `app/globals.css` 의 컴포넌트 클래스(`.field` `.chip` `.filter-head` 등)에는 토큰과 **중복되는
  raw hex 가 다수** 박혀 있다(예: `#ddd0ba` = `outline-variant`). CI 가드는 tsx 만 검사하므로
  통과한다. **신규 작업에서 이 패턴을 따라 하지 말 것.** 여유 될 때 토큰 참조로 정리 대상.

---

## 핵심 제약 (디자인 외)

- **체크리스트 보안**: 체크리스트는 업체(비로그인)에게 절대 노출 금지. Supabase RLS 로 anon read
  정책을 아예 안 만들어 DB 레벨에서 원천 차단. admin(Supabase Auth 단일 계정)만 조회.
- **사진 조회는 행 FK 로.** 공간 이동 시 고아 방지 — 공간이 아니라 행 FK 기준으로 사진을 매단다.
- **실데이터 원본은 DB(Supabase).** `lib/seed.ts` 는 목업/폴백 전용, 개인 실데이터 커밋 금지.

## 워크플로우 / CI

- 모든 변경은 **별도 워크트리 → 커밋 → PR → 머지 → 워크트리 정리**. 메인 경로는 항상 `main`.
- CI 는 관심사별로 분리: `lint`(ESLint + design tokens) · `types` · `test`(unit) · `e2e`(Playwright)
  · `build` · `sast` · `secrets` · `deps`.
- 로컬 검증: `npm run lint && npm run lint:tokens && npm run typecheck && npm test`.
  dev 서버와 e2e 동시 실행은 WSL OOM 유발 — 단일 서버로 돌린다.
