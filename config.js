/* 하우어바웃 설정. 아래 값만 채우면 후기와 AI가 켜져요. 비워 두면 해당 기능만 꺼진 채로 동작해요. */
window.HOWABOUT = {
  /* 지도 스타일 (키 필요 없음). 더 단순한 지도는 .../styles/positron, 색이 많은 지도는 .../styles/bright */
  mapStyle: 'https://tiles.openfreemap.org/styles/liberty',

  /* AI 조건 해석: Cloudflare Worker 주소. 예) https://howabout-ai.내계정.workers.dev
     비워 두면 키워드 기반 기본 해석으로 동작해요. */
  aiUrl: '',

  /* 후기 저장소: Firebase 웹 앱 설정값 (Firebase 콘솔 > 프로젝트 설정 > 내 앱) */
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: ''
  }
};
