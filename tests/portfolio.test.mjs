// 포트폴리오 빌드 결과물(_site/portfolio, portfolio.pdf)을 검증한다. 실행 전 `npm run build && npm run pdf` 필요.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const site = path => new URL(`../_site/${path}`, import.meta.url);
const read = path => readFileSync(site(path), "utf8");

const index = read("portfolio/index.html");

test("목차에 공통 주제, 포트폴리오 PDF 링크, 이력서로 돌아가는 링크가 있다", () => {
  assert.match(index, /data-portfolio="theme"[^>]*>\s*[^<\s]/);
  assert.match(index, /href="\/resume\/portfolio\.pdf"/);
  assert.match(index, /href="\/resume\/"/);
});

// 목차에 링크된 사례 경로(/resume/portfolio/<slug>/)를 읽는 순서대로
const caseLinks = [...index.matchAll(/<li data-case>[\s\S]*?href="(\/resume\/portfolio\/[^"]+\/)"/g)].map(m => m[1]);
const casePath = link => `${link.slice("/resume/".length)}index.html`;

test("목차가 공개된 사례를 읽는 순서대로, 한 줄 결론과 함께 링크한다", () => {
  assert.deepEqual(caseLinks, ["/resume/portfolio/realtime-grading/", "/resume/portfolio/quality-loop/", "/resume/portfolio/prompt-cicd-gate/"]);
  for (const link of caseLinks) assert.ok(existsSync(site(casePath(link))), `없는 페이지: ${link}`);
  const items = [...index.matchAll(/<li data-case>([\s\S]*?)<\/li>/g)].map(m => m[1]);
  assert.equal(items.length, caseLinks.length);
  for (const item of items) assert.match(item, /data-case-conclusion[^>]*>\s*\S/);
});

const SECTIONS = ["문제", "판단", "구현", "결과", "한계와 다음 단계"];
const sectionsOf = html => [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(m => m[1].trim());

for (const [n, link] of caseLinks.entries()) {
  const html = read(casePath(link));

  test(`사례 ${link}: 요약 박스 다음에 문제 → 판단 → 구현 → 결과 → 한계와 다음 단계가 순서대로 나온다`, () => {
    for (const item of ["conclusion", "period", "tech", "mine", "team", "bullets"]) {
      assert.match(html, new RegExp(`data-summary-item="${item}"[^>]*>\\s*(<ul>\\s*<li>|<blockquote>)?[^<\\s]`), item);
    }
    assert.match(html, /data-summary-item="bullets"[^>]*>\s*<blockquote>/);
    assert.deepEqual(sectionsOf(html), SECTIONS);
    assert.ok(html.indexOf("data-summary") < html.indexOf("<h2"), "요약 박스가 문제보다 앞에 있어야 한다");
  });

  test(`사례 ${link}: 구현 섹션에 다이어그램이 있고, 모든 다이어그램은 figcaption이 있는 인라인 SVG다`, () => {
    const [from, to] = [html.search(/<h2[^>]*>구현</), html.search(/<h2[^>]*>결과</)];
    assert.ok(from > 0 && to > from, "구현·결과 섹션이 있어야 한다");
    assert.match(html.slice(from, to), /<figure[\s\S]*?<svg/, "구현 섹션에 다이어그램이 있어야 한다");
    const figures = [...html.matchAll(/<figure[\s\S]*?<\/figure>/g)].map(m => m[0]);
    assert.equal((html.match(/<svg/g) ?? []).length, figures.length, "SVG는 모두 figure 안에 있어야 한다");
    for (const fig of figures) {
      assert.equal((fig.match(/<svg/g) ?? []).length, 1, "figure 하나에 SVG 하나");
      assert.match(fig, /<svg[^>]*role="img"/);
      assert.match(fig, /<svg[^>]*aria-label="[^"]+"/);
      assert.match(fig, /<figcaption>[^<]+<\/figcaption>/);
      for (const tag of ["<script", "<style", "<foreignObject", "<p>", "<img"]) assert.ok(!fig.includes(tag), tag);
    }
  });

  test(`사례 ${link}: 하단에 이전·다음 사례와 목차 링크가 있다`, () => {
    const nav = html.match(/<nav[^>]*data-case-nav[\s\S]*?<\/nav>/)?.[0] ?? "";
    assert.match(nav, /rel="index" href="\/resume\/portfolio\/"/);
    const prev = nav.match(/rel="prev" href="([^"]+)"/)?.[1];
    const next = nav.match(/rel="next" href="([^"]+)"/)?.[1];
    assert.equal(prev, caseLinks[n - 1]);
    assert.equal(next, caseLinks[n + 1]);
  });
}

test("인쇄용 페이지가 목차 뒤에 공개된 사례를 같은 순서로 담고, 링크는 모두 절대 URL이다", () => {
  const print = read("portfolio/print/index.html");
  assert.match(print, /data-portfolio="theme"/);
  const slugs = [...print.matchAll(/data-case-slug="([^"]+)"/g)].map(m => `/resume/portfolio/${m[1]}/`);
  assert.deepEqual(slugs, caseLinks);
  const hrefs = [...print.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map(m => m[1]);
  assert.ok(hrefs.length > 0);
  for (const href of hrefs) assert.match(href, /^https:\/\/eatingbug\.github\.io\/resume\//, href);
});

test("포트폴리오 PDF가 생성되고, 목차 한 페이지에 사례마다 최소 한 페이지가 더해진다", () => {
  const pdf = site("portfolio.pdf");
  assert.ok(existsSync(pdf), "portfolio.pdf 없음");
  const pages = readFileSync(pdf).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
  assert.ok(pages.length >= 1 + caseLinks.length, `pages=${pages.length}, cases=${caseLinks.length}`);
});

// 이력서 금지 목록과 달리 "월 7만~15만"·"A/B"는 포트폴리오에서 허용한다(사례 ②·③ 소재).
const BANNED = [
  "필리핀", "외주", "5~7일", "경찰청", "우수상", "수상", "후보", "Habiquest", "1,688",
  "Prompt-Lab", "AI-Backend", "서빙 서버", "AI 모듈",
  "검증 데이터셋", "Golden Dataset",
  "$", "010-", "creverse.com",
];

// 서비스명은 금지어 자체가 공개 저장소에 드러나지 않게 base64로 둔다
const BANNED_ENCODED = ["SFVNTUlOR28=", "7ZeI67CN6rOg"].map(b => Buffer.from(b, "base64").toString("utf8").toLowerCase());

test("포트폴리오 공개본에 민감 정보가 없다", () => {
  const pages = ["portfolio/index.html", "portfolio/print/index.html", ...caseLinks.map(casePath)];
  for (const path of pages) {
    const html = read(path);
    for (const s of BANNED) assert.ok(!html.includes(s), `${path}: ${s}`);
    const lower = html.toLowerCase();
    BANNED_ENCODED.forEach((s, i) => assert.ok(!lower.includes(s), `${path}: 서비스명 #${i}`));
  }
});
