// 빌드 결과물(_site)을 검증한다. 실행 전 `npm run build && npm run pdf` 필요.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync(new URL("../_site/index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../_site/assets/css/resume.css", import.meta.url), "utf8");
const pdfPath = new URL("../_site/resume.pdf", import.meta.url);

test("헤더에 이름, 직함, 연락처, PDF 링크가 있다", () => {
  assert.match(html, /홍승재/);
  assert.match(html, /AI Engineer · LLMOps &amp; Evaluation/);
  assert.match(html, /href="mailto:hsj5972@naver\.com"/);
  assert.match(html, /href="https:\/\/github\.com\/eatingbug"/);
  assert.match(html, /href="\/resume\/resume\.pdf"/);
});

test("섹션이 합의한 순서로 나온다", () => {
  const order = ["About", "Skills", "Experience", "조직 AX", "Other", "Education"]
    .map(label => html.indexOf(`data-section="${label}"`));
  assert.ok(order.every(i => i > 0), `누락된 섹션: ${order}`);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test("핵심 수치가 들어 있다", () => {
  for (const s of ["10초대", "94%", "월 7만~15만 건", "월 2만~5만 건", "약 3주"]) {
    assert.ok(html.includes(s), s);
  }
});

test("공개본에 민감 정보가 없다", () => {
  for (const s of ["필리핀", "$", "1,688", "010-", "creverse.com", "Habiquest"]) {
    assert.ok(!html.includes(s), s);
  }
});

test("A4 인쇄 설정이 있다", () => {
  assert.match(css, /@page\s*\{[^}]*size:\s*A4/);
  assert.match(css, /\.no-print/);
});

test("PDF가 1~2페이지로 생성된다", () => {
  assert.ok(existsSync(pdfPath), "resume.pdf 없음");
  const pages = readFileSync(pdfPath).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
  assert.ok(pages.length >= 1 && pages.length <= 2, `pages=${pages.length}`);
});
