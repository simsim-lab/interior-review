import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Spinner from "../../components/Spinner";
import LoadingScreen from "../../components/LoadingScreen";

// 로딩 UI 는 순수 프레젠테이션 컴포넌트라 서버 렌더 마크업으로 결정론적 검증이 가능하다
// (RTL 등 신규 의존성 불필요). 접근성 속성·회전 클래스·라벨 노출을 확인한다.

test("Spinner: 회전 애니메이션 클래스(.spinner)와 aria-hidden 을 가진다", () => {
  const html = renderToStaticMarkup(createElement(Spinner));
  assert.match(html, /class="spinner[^"]*"/); // globals.css 의 회전 애니메이션 훅
  assert.match(html, /aria-hidden="true"/); // 장식 요소 → 스크린리더 무시
});

test("Spinner: size prop 이 width/height 에 반영된다", () => {
  const html = renderToStaticMarkup(createElement(Spinner, { size: 40 }));
  assert.match(html, /width="40"/);
  assert.match(html, /height="40"/);
});

test("LoadingScreen: role=status·aria-live·testid·기본 라벨을 노출한다", () => {
  const html = renderToStaticMarkup(createElement(LoadingScreen));
  assert.match(html, /role="status"/); // 스크린리더에 "처리 중" 상태 전달
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /data-testid="route-loading"/); // E2E 훅
  assert.match(html, /불러오는 중/); // 기본 라벨
});

test("LoadingScreen: label prop 으로 문구를 바꿀 수 있다", () => {
  const html = renderToStaticMarkup(
    createElement(LoadingScreen, { label: "로그인 중…" })
  );
  assert.match(html, /로그인 중/);
  assert.doesNotMatch(html, /불러오는 중/);
});
