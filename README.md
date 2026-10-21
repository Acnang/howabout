



## 한도 (2026-10-15 공식 문서 기준)
- Firestore: 저장 1GiB, 하루 읽기 5만 / 쓰기 2만 / 삭제 2만
- Cloudflare Workers: 하루 10만 요청
- OpenFreeMap 지도: 키 없이 요청 제한 없음, 출처 표기 필요(화면 하단에 이미 있음)
- Nominatim(위치 검색): 초당 1회, 결과 캐시 필수, 자동완성 금지 (앱은 검색 버튼을 눌렀을 때만 호출)
- Overpass(관광지 데이터) : 무제한

## 사용 api
- Firestore
- Gemini
- Cloudflare 

## 파일
`index.html` `style.css` `app.js` `config.js` : 사이트 / `worker.js` : AI 프록시 / `firestore.rules` : 후기 보안 규칙

## 진짜 진심으로 집가고싶다
- Instagram : @collute_study_log
