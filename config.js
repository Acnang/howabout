/* 하우어바웃 설정. 아래 값만 채우면 후기와 AI가 켜져요. 비워 두면 해당 기능만 꺼진 채로 동작해요. */
window.HOWABOUT = {
  /* 지도 스타일 (키 필요 없음). 더 단순한 지도는 .../styles/positron, 색이 많은 지도는 .../styles/bright */
  mapStyle: 'https://tiles.openfreemap.org/styles/liberty',

  /* AI 조건 해석: Cloudflare Worker 주소. 예) https://howabout-ai.내계정.workers.dev
     비워 두면 키워드 기반 기본 해석으로 동작해요. */
  aiUrl: 'https://howabout-ai.kimchman0625.workers.dev',

  /* 후기 저장소: Firebase 웹 앱 설정값 (Firebase 콘솔 > 프로젝트 설정 > 내 앱) */
  firebase: {
    apiKey: 'AIzaSyDEa2qGvoE3uAwtk5zAr63heRn1k2HApg8',
    authDomain: 'howabout-ce1c5.firebaseapp.com',
    projectId: 'howabout-ce1c5',
    appId: '1:951096376995:web:2044e03f7f0084d6648916'
  }
};
