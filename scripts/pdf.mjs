// _site 를 baseurl(/resume) 아래로 띄우고, 웹폰트 로딩이 끝난 뒤 이력서와 포트폴리오를 각각 A4 PDF로 출력한다.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const SITE = fileURLToPath(new URL("../_site/", import.meta.url));
const BASE = "/resume";
const FONT = '12px "Pretendard Variable"';
// 포트폴리오 PDF는 사례를 모두 이어 붙인 인쇄용 페이지에서 만든다
const TARGETS = [
  { path: "/", out: "resume.pdf" },
  { path: "/portfolio/print/", out: "portfolio.pdf" },
];
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".pdf": "application/pdf" };

const server = createServer(async (req, res) => {
  let path;
  try {
    path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    return res.writeHead(400).end();
  }
  if (path !== BASE && !path.startsWith(BASE + "/")) return res.writeHead(404).end();
  let file = normalize(join(SITE, path.slice(BASE.length)));
  if (!(file + sep).startsWith(SITE)) return res.writeHead(403).end();
  if (file === SITE.slice(0, -1) || file.endsWith(sep)) file = join(file, "index.html");
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const { port } = server.address();

const browser = await chromium.launch();
try {
  for (const target of TARGETS) {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}${BASE}${target.path}`, { waitUntil: "load" });
    // 폰트가 대체 글꼴로 떨어지면 줄바꿈이 달라져 페이지 수가 바뀌므로 실패시킨다
    const fontLoaded = await page.evaluate(async font => {
      await document.fonts.load(font, "가");
      await document.fonts.ready;
      return document.fonts.check(font, "가");
    }, FONT);
    if (!fontLoaded) throw new Error(`Pretendard 웹폰트를 불러오지 못했습니다: ${target.path}`);
    await page.pdf({ path: join(SITE, target.out), format: "A4", preferCSSPageSize: true, printBackground: true });
    await page.close();
    console.log(`wrote _site/${target.out}`);
  }
} finally {
  await browser.close();
  server.close();
}
