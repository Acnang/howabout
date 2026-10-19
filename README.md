# 하우어바웃 설치 가이드 (태블릿에서 전부 가능)

필요한 것: GitHub, Google, Cloudflare 계정 (모두 무료). 1번만 해도 사이트는 열려요. 2번은 후기, 3번은 AI 기능이에요.

## 1. 사이트 올리기 (GitHub Pages)
1. github.com 에서 New repository, 이름 `howabout`, Public으로 만들기
2. Add file > Upload files 에서 `index.html`, `style.css`, `app.js`, `config.js` 4개 올리고 Commit
3. Settings > Pages > Branch를 `main` / `(root)`로 고르고 Save
4. 1~3분 뒤 `https://내계정.github.io/howabout/` 로 열려요. 이 주소가 배포 URL이에요.

## 2. 후기 저장소 (Firebase Firestore)
1. console.firebase.google.com 에서 프로젝트 추가
2. Build > Firestore Database > 데이터베이스 만들기 (위치는 asia-northeast3 서울, 프로덕션 모드)
3. Firestore 의 Rules 탭에 `firestore.rules` 내용을 통째로 붙여넣고 게시
4. Build > Authentication > 시작하기 > Sign-in method > 익명(Anonymous) 사용 설정
5. Authentication > Settings > 승인된 도메인에 `내계정.github.io` 추가
6. 프로젝트 설정 > 일반 > 내 앱에서 웹 앱(</>) 추가 후 나오는 `apiKey`, `authDomain`, `projectId`, `appId`를 GitHub의 `config.js`에 붙여넣기 (파일 열고 연필 아이콘으로 수정)

## 3. AI 조건 해석 (Cloudflare Worker + Gemini)
1. aistudio.google.com 에서 API 키 만들기
2. dash.cloudflare.com > Workers & Pages > Create > Hello World 로 Worker 만들기 (이름 `howabout-ai`)
3. Edit code 에서 `worker.js` 내용으로 교체하고 Deploy
4. Settings > Variables and Secrets 에 추가
   - `GEMINI_API_KEY` (Secret): 1번에서 만든 키
   - `ALLOWED_ORIGIN` : `https://내계정.github.io` (끝에 슬래시나 경로 없이)
5. Worker 주소(`https://howabout-ai.내계정.workers.dev`)를 `config.js`의 `aiUrl`에 붙여넣기

`aiUrl`이 비어 있으면 키워드 기반 기본 해석으로 동작해요. 사용 모델은 기본 `gemini-3.5-flash-lite`이고, 바꾸려면 Worker에 `GEMINI_MODEL` 변수를 추가하세요.

## 동작 확인
- 서울, 부산 같은 내장 도시는 인터넷 검색 없이 바로 나와요.
- 도쿄처럼 직접 검색하면 위치 검색, 관광지 수집, AI 해석 순서로 진행돼요. 첫 검색은 최대 30초 걸릴 수 있고 결과는 7일간 저장돼요.
- 장소 카드의 후기 버튼은 Firebase 설정이 끝나야 보여요.

## 무료 한도 (2026-10-15 공식 문서 기준)
- Firestore: 저장 1GiB, 하루 읽기 5만 / 쓰기 2만 / 삭제 2만
- Cloudflare Workers: 하루 10만 요청
- Gemini 무료 등급: 모델마다 한도가 달라서 AI Studio에서 확인하세요. 무료 등급 입력 내용의 이용 조건은 약관을 확인하세요.
- OpenFreeMap 지도: 키 없이 요청 제한 없음, 출처 표기 필요(화면 하단에 이미 있어요)
- Nominatim(위치 검색): 초당 1회, 결과 캐시 필수, 자동완성 금지 (앱은 검색 버튼을 눌렀을 때만 호출해요)
- Overpass(관광지 데이터): 공용 서버 공정 사용 범위 안에서만 쓰세요.

## 파일
`index.html` `style.css` `app.js` `config.js` : 사이트 / `worker.js` : AI 프록시 / `firestore.rules` : 후기 보안 규칙
