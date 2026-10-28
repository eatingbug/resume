# resume

홍승재 이력서. https://eatingbug.github.io/resume/

- 내용: `_data/resume.yml` 만 수정한다. 경력·프로젝트·AX 항목·기타·학력·사이드 프로젝트에 `visible: false` 를 주면 렌더링되지 않는다. 프로젝트의 `case: <사례 slug>` 는 그 사례가 공개됐을 때만 제목 옆 "사례 →" 링크가 된다.
- 레이아웃: `_layouts/resume.html`, 스타일: `assets/css/resume.css` (A4 인쇄 설정 포함)
- 포트폴리오: 목차 문구는 `_data/portfolio.yml`, 사례 원문은 `_cases/<slug>.md`(결론·기여 요약·역할 분담·읽는 순서는 front matter). 웹은 옆 목차와 역할 분담을 두고, 모바일과 PDF는 한 열로 읽는다. 스타일은 `assets/css/portfolio.css`. `print_breaks`에는 PDF에서 새 페이지로 시작할 본문 제목의 id를 둔다. 아직 공개하지 않을 사례는 `published: false`로 두면 페이지·목차·PDF·이전/다음 이동에서 모두 빠진다. 다이어그램은 `_includes/diagrams/`의 인라인 SVG.
- `main`에 push하면 GitHub Actions가 Jekyll 빌드 → Playwright로 `resume.pdf`·`portfolio.pdf` 생성 → 테스트 → Pages 배포를 한다. PDF는 커밋하지 않는다.

## 로컬

```sh
bundle install && npm ci && npx playwright install chromium
npm run build && npm run pdf && npm test
bundle exec jekyll serve   # http://127.0.0.1:4000/resume/
```

Ruby 3.3, Node 22 기준.
