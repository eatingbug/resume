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
  for (const s of ["10초대", "94%", "평균 3.5일", "누적 55만 건", "월 2만~5만 건", "약 3주"]) {
    assert.ok(html.includes(s), s);
  }
});

test("공개본에 민감 정보가 없다", () => {
  for (const s of ["필리핀", "외주", "5~7일", "월 7만~15만", "$", "1,688", "010-", "creverse.com", "Habiquest", "Prompt-Lab", "AI-Backend", "A/B"]) {
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

// 이력서 PDF는 이 웹 페이지를 그대로 인쇄하므로, 포트폴리오로 가는 링크는 웹에서도 절대 URL이다
const ORIGIN = "https://eatingbug.github.io/resume/";
const ORIGIN_RE = ORIGIN.replace(/[.\/]/g, "\\$&");
const pageOf = href => new URL(`../_site/${href.slice(ORIGIN.length)}index.html`, import.meta.url);

test("연락처 줄의 포트폴리오 링크가 목차를 가리킨다", () => {
  const contact = html.match(/<div class="contact">[\s\S]*?<\/div>/)?.[0] ?? "";
  assert.match(contact, new RegExp(`href="${ORIGIN_RE}portfolio/"[^>]*>포트폴리오<`));
  assert.ok(existsSync(pageOf(`${ORIGIN}portfolio/`)), "목차 페이지 없음");
});

test("크레버스 프로젝트 제목 옆 \"사례 →\"가 공개된 사례를 하나씩 가리킨다", () => {
  const caseLinks = [...html.matchAll(new RegExp(`<a\\b[^>]*href="(${ORIGIN_RE}portfolio/[^"]+/)"[^>]*>사례 →</a>`, "g"))].map(m => m[1]);
  const toc = readFileSync(new URL("../_site/portfolio/index.html", import.meta.url), "utf8");
  const published = [...toc.matchAll(/<li data-case>[\s\S]*?href="\/resume\/([^"]+)"/g)].map(m => ORIGIN + m[1]);
  assert.ok(published.length > 0, "공개된 사례 없음");
  // 이력서 프로젝트 순서와 사례 읽는 순서는 따로 바뀔 수 있으므로 집합으로 비교한다
  assert.deepEqual([...caseLinks].sort(), [...published].sort());
  for (const href of caseLinks) assert.ok(existsSync(pageOf(href)), `없는 페이지: ${href}`);
  // bullet이 아니라 프로젝트 제목에만 단다
  const titles = [...html.matchAll(/<h3>[\s\S]*?<\/h3>/g)].map(m => m[0]).filter(h => h.includes("사례 →"));
  assert.equal(titles.length, caseLinks.length);
  for (const li of html.matchAll(/<li>[\s\S]*?<\/li>/g)) assert.ok(!li[0].includes("사례 →"), li[0]);
});
