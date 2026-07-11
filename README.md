# 우리집 리모델링 — 인테리어 요구사항 보드

**라이브: https://interior-review.vercel.app** · `main` push 시 Vercel 자동 배포.

인테리어 업체 미팅 준비용 웹앱. 공간별 **현재상태 / 요구사항**을 정리해 업체에게 웹으로 전달하고,
**체크리스트**(업체 평가)는 관리자만 볼 수 있게 분리한다.

스택은 `hakgun-viewer`와 동일: **Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + Vercel**.

## 페이지
- `/current-state` — 현재상태 (공간별 텍스트 + 사진, 공개)
- `/requirements` — 요구사항 (공간별 표 + 레퍼런스 사진, 공개)
- `/checklist` — 업체 평가 체크리스트 (**관리자 전용**, 체크·별점·메모)
- `/login` — 관리자 로그인

사진은 클릭 시 **전체화면 라이트박스**로 열리고 확대/축소·이동·이전/다음 지원.

## 보안 설계 (핵심)
체크리스트는 업체(비로그인)에게 **절대** 노출되지 않는다.
- Supabase RLS 에서 `checklist_items` 테이블에 anon 읽기 정책을 **만들지 않음** → 비로그인은 DB 레벨에서 select 자체가 차단.
- 관리자는 Supabase Auth(이메일/비밀번호)로 로그인해야만 조회·수정 가능.
- 프론트 숨김이 아니라 데이터 자체를 안 내려보내므로 소스보기·개발자도구로도 안 보임.

## 로컬 실행
```bash
npm install
npm run dev   # http://localhost:3000
```
`.env.local` 이 비어 있으면 `lib/seed.ts` 데모 데이터로 렌더된다(레이아웃 확인용).
`NEXT_PUBLIC_ADMIN_DEV_BYPASS=1` 이면 로컬에서 로그인 없이 체크리스트를 미리 볼 수 있다.

## Supabase 연결
1. supabase.com 에서 이 프로젝트 전용 프로젝트 생성.
2. `supabase/schema.sql` 을 SQL Editor 에 붙여넣어 실행 (테이블 + RLS + Storage 버킷).
3. Authentication → Users 에서 관리자 계정 1개 생성 (이메일/비밀번호).
4. Project Settings → API 의 값으로 `.env.local` 채우기:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # 시드 스크립트용 (서버 전용)
   NEXT_PUBLIC_ADMIN_DEV_BYPASS=0
   ```
5. (선택) 데모 데이터 적재: `npm run seed`

## 배포 (Vercel)
- Vercel 프로젝트로 import 후 위 env 를 Project Settings → Environment Variables 에 등록.
- 업체는 배포 URL 로 접속(현재상태/요구사항만 열람). 체크리스트 링크·데이터는 관리자 로그인 전에는 노출되지 않음.

## 스타일
색상·타이포·radius·spacing 토큰은 `space_requirement.txt`/`check_list.txt` (AtelierSync 목업)과 동일하게
`tailwind.config.ts` 에 옮겨져 있다. 변경 시 목업과의 일관성이 깨지므로 주의.
