# resume

홍승재 이력서. https://eatingbug.github.io/resume/

- 내용: `_data/resume.yml` 만 수정한다. 경력·프로젝트·AX 항목·기타·학력·사이드 프로젝트에 `visible: false` 를 주면 렌더링되지 않는다.
- 레이아웃: `_layouts/resume.html`, 스타일: `assets/css/resume.css` (A4 인쇄 설정 포함)
- `main`에 push하면 GitHub Actions가 Jekyll 빌드 → Playwright로 `resume.pdf` 생성 → 테스트 → Pages 배포를 한다. PDF는 커밋하지 않는다.

## 로컬

```sh
bundle install && npm ci && npx playwright install chromium
npm run build && npm run pdf && npm test
bundle exec jekyll serve   # http://127.0.0.1:4000/resume/
```

Ruby 3.3, Node 22 기준.
