import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAllowlist, isEmailAllowed } from "../admin-allowlist";

test("parseAllowlist: trim·소문자·빈값 제거", () => {
  assert.deepEqual(parseAllowlist(" A@x.com , b@Y.com ,, "), [
    "a@x.com",
    "b@y.com",
  ]);
  assert.deepEqual(parseAllowlist(undefined), []);
  assert.deepEqual(parseAllowlist(""), []);
});

test("isEmailAllowed: allowlist 미설정이면 항상 false (fail-closed)", () => {
  // 핵심 보안 불변식: 목록이 비면 로그인해도 admin 아님.
  assert.equal(isEmailAllowed("a@x.com", []), false);
});

test("isEmailAllowed: 목록에 있으면 true (대소문자 무시)", () => {
  const list = ["admin@x.com"];
  assert.equal(isEmailAllowed("ADMIN@x.com", list), true);
  assert.equal(isEmailAllowed("other@x.com", list), false);
});

test("isEmailAllowed: 빈/null/undefined 이메일 → false", () => {
  assert.equal(isEmailAllowed(null, ["a@x.com"]), false);
  assert.equal(isEmailAllowed(undefined, ["a@x.com"]), false);
  assert.equal(isEmailAllowed("", ["a@x.com"]), false);
});
