'use strict';
/* 하우어바웃 v2
   - 지도: MapLibre + OpenFreeMap (키 없이 무료)
   - 장소 검색: Nominatim(지오코딩) + Overpass(관광지 데이터), 한국 6개 도시는 내장 데이터
   - AI: Cloudflare Worker 주소(config.js의 aiUrl)가 있으면 Gemini로 조건 해석, 없으면 기본 해석
   - 후기: Firebase Firestore (config.js에 값이 있을 때만) */
const CFG=Object.assign({mapStyle:'https://tiles.openfreemap.org/styles/liberty',aiUrl:'',firebase:{}},window.HOWABOUT||{});

const CITY_DATA={
seoul:{n:'서울',c:[37.5665,126.9780],v:22,m:'대중교통',p:[
['경복궁',37.5796,126.9770,'cult,photo',9,18,90,2,3000,'조선의 법궁, 한복 입고 걷기 좋아요'],
['북촌한옥마을',37.5826,126.9830,'photo,heal',10,17,60,2,6000,'골목 따라 한옥 풍경을 걷는 코스'],
['인사동',37.5744,126.9858,'food,cult',11,21,60,1,12000,'전통 찻집과 공예품 거리'],
['남산서울타워',37.5512,126.9882,'photo,act',10,23,90,2,21000,'도시 전망과 야경 포인트'],
['반포 한강공원',37.5106,126.9959,'heal,photo',0,24,90,1,8000,'달빛무지개분수와 돗자리 피크닉'],
['성수동 카페거리',37.5445,127.0557,'food,photo',11,22,90,1,15000,'공장 개조 카페와 편집숍'],
['서울스카이',37.5126,127.1025,'act,photo',10.5,22,90,1,29000,'롯데월드타워 전망대'],
['광장시장',37.5701,126.9996,'food',9,22,60,1,12000,'빈대떡, 마약김밥, 육회'],
['인왕산 성곽길',37.5833,126.9585,'act,heal',5,21,100,3,3000,'서울 성곽 따라 오르는 도심 트레킹'],
['익선동 한옥거리',37.5742,126.9889,'food,photo',11,22,60,1,15000,'한옥을 개조한 식당과 카페'],
['서울숲',37.5444,127.0374,'heal',0,24,70,1,3000,'넓은 숲 산책과 피크닉'],
['동대문디자인플라자',37.5665,127.0092,'photo,cult',10,21,60,1,5000,'곡선 건축과 전시, 야간 조명']]},
busan:{n:'부산',c:[35.1796,129.0756],v:24,m:'대중교통',p:[
['해운대 해수욕장',35.1587,129.1604,'heal,photo',0,24,90,1,5000,'탁 트인 바다 산책과 커피 한 잔'],
['해동용궁사',35.1884,129.2234,'cult,photo',5.5,18,60,2,3000,'바다 위에 얹은 절, 일출 명소'],
['감천문화마을',35.0975,129.0107,'photo,cult',9,18,90,2,2000,'파스텔 골목과 스탬프 투어'],
['광안리 해수욕장',35.1532,129.1186,'heal,photo,food',0,24,60,1,10000,'광안대교 야경과 해변 카페'],
['자갈치시장',35.0968,129.0306,'food',5,22,60,1,25000,'활어회와 꼼장어 구이'],
['흰여울문화마을',35.0775,129.0426,'photo,heal',0,24,60,2,7000,'절벽 위 바닷길 산책'],
['송도 해상케이블카',35.0764,129.0170,'act,photo',9.5,21,60,1,16000,'바다를 가로지르는 케이블카'],
['블루라인파크 해변열차',35.1608,129.1740,'act,heal,photo',9,19,90,1,11000,'청사포 해안 철길을 달리는 열차'],
['국제시장',35.1005,129.0273,'food',10,20,60,1,10000,'씨앗호떡과 비빔당면'],
['태종대',35.0514,129.0872,'heal,act',4,24,120,3,8000,'절벽 해안을 도는 산책길'],
['이기대 갈맷길',35.1225,129.1225,'act,heal',0,24,120,3,3000,'바다를 끼고 걷는 해안 트레일'],
['센텀시티 신세계',35.1693,129.1311,'food,photo',10.5,20,90,1,30000,'대형 백화점과 스파, 전망 카페']]},
jeju:{n:'제주',c:[33.4996,126.5312],v:32,m:'렌터카',p:[
['성산일출봉',33.4580,126.9425,'act,photo',7,19,90,3,5000,'분화구까지 오르는 일출 명소'],
['협재해수욕장',33.3939,126.2398,'heal,photo',0,24,90,1,8000,'에메랄드빛 바다와 비양도 풍경'],
['오설록 티뮤지엄',33.3058,126.2895,'heal,food',9,18,60,1,10000,'녹차밭 산책과 디저트'],
['카멜리아힐',33.2896,126.3693,'photo,heal',8.5,18,90,1,9000,'동백 정원 포토 스폿'],
['한라산 어리목 코스',33.3866,126.4977,'act',6,15,240,3,8000,'가볍게 오르는 한라산 트레킹'],
['동문시장',33.5133,126.5290,'food',8,21,60,1,15000,'흑돼지, 감귤 디저트, 야시장'],
['용두암',33.5164,126.5122,'photo',0,24,30,1,0,'공항 근처 바닷가 바위 명소'],
['섭지코지',33.4240,126.9300,'heal,photo',0,24,90,2,5000,'초원과 바다를 따라 걷는 해안 산책'],
['월정리 해변',33.5560,126.7960,'heal,food',0,24,60,1,12000,'투명한 바다와 해변 카페'],
['한담해안산책로',33.4637,126.3115,'heal,photo',0,24,60,1,6000,'애월 해안 따라 걷는 길'],
['이호테우해변',33.4980,126.4530,'heal,photo',0,24,60,1,5000,'말 모양 등대와 노을 포인트'],
['산방산·용머리해안',33.2406,126.3100,'act,photo',9,17,90,2,6000,'해안 절벽과 산방산 산책']]},
gangneung:{n:'강릉',c:[37.7519,128.8761],v:30,m:'차량',p:[
['경포해변',37.8056,128.9078,'heal,photo',0,24,60,1,6000,'넓은 백사장과 소나무 숲'],
['경포호 산책로',37.7950,128.9050,'heal',0,24,60,1,3000,'호수 한 바퀴 걷기'],
['안목해변 커피거리',37.7714,128.9486,'food,heal',9,22,60,1,8000,'바다 앞 커피 명소'],
['강릉 중앙시장',37.7525,128.8993,'food',9,20,60,1,12000,'닭강정, 수제 어묵, 감자옹심이'],
['오죽헌',37.7794,128.8782,'cult',9,18,60,1,3000,'율곡 이이가 태어난 한옥'],
['정동진',37.6914,129.0338,'photo,heal',0,24,90,1,8000,'바다와 가장 가까운 기차역'],
['선교장',37.7878,128.8855,'cult,heal',9,18,60,1,5000,'조선 사대부 한옥 고택'],
['정동진 레일바이크',37.6960,129.0230,'act,photo',9,17,60,2,15000,'바다를 보며 달리는 레일바이크'],
['초당순두부마을',37.7940,128.9130,'food',8,20,60,1,12000,'초당 두부 정식'],
['대관령 양떼목장',37.6913,128.7547,'heal,act',9,18,90,2,6000,'능선 따라 걷는 초원 산책'],
['주문진 수산시장',37.8941,128.8244,'food',6,20,60,1,25000,'오징어와 활어회'],
['소돌 아들바위공원',37.8969,128.8325,'photo,heal',0,24,40,1,0,'바다 기암괴석 해안']]},
jeonju:{n:'전주',c:[35.8242,127.1480],v:20,m:'대중교통',p:[
['전주한옥마을',35.8150,127.1530,'photo,cult,food',0,24,120,1,8000,'한복 체험과 길거리 간식'],
['경기전',35.8149,127.1498,'cult,photo',9,18,40,1,3000,'태조 어진을 모신 사당'],
['남부시장',35.8120,127.1450,'food',9,21,60,1,10000,'청년몰과 콩나물국밥'],
['오목대',35.8139,127.1560,'photo,heal',0,24,30,2,0,'한옥마을이 내려다보이는 언덕'],
['전동성당',35.8133,127.1489,'cult,photo',9,18,30,1,0,'붉은 벽돌 로마네스크 성당'],
['덕진공원',35.8445,127.1228,'heal',0,24,60,1,0,'연꽃 연못 산책'],
['삼천동 막걸리골목',35.7939,127.1230,'food',12,23,90,1,25000,'주전자 막걸리와 한 상 안주'],
['자만벽화마을',35.8110,127.1620,'photo',0,24,60,2,3000,'한옥마을 건너편 벽화 골목'],
['모악산',35.7300,127.0855,'act,heal',6,18,180,3,5000,'가벼운 등산 코스'],
['국립무형유산원',35.8140,127.1370,'cult',9,18,60,1,0,'전통 공연과 전시'],
['한벽당',35.8036,127.1658,'photo,heal',0,24,30,1,0,'전주천 옆 누각'],
['아중호수',35.8095,127.1750,'heal,food',0,24,60,1,8000,'호수 산책과 카페 거리']]},
gyeongju:{n:'경주',c:[35.8562,129.2247],v:26,m:'대중교통',p:[
['불국사',35.7900,129.3320,'cult,photo',7,18,90,2,6000,'신라 불교 건축의 정수'],
['석굴암',35.7953,129.3494,'cult,heal',7,17,60,2,6000,'토함산 위 석굴 사원'],
['첨성대',35.8347,129.2190,'photo,cult',0,24,40,1,3000,'오래된 신라 천문대'],
['동궁과 월지',35.8341,129.2269,'photo,cult',9,22,60,1,3000,'연못에 비친 야경 명소'],
['황리단길',35.8386,129.2113,'food,photo',10,22,90,1,15000,'한옥 카페와 디저트 골목'],
['대릉원',35.8383,129.2108,'cult,heal',9,22,40,1,3000,'거대한 신라 고분 산책'],
['교촌마을',35.8281,129.2165,'cult,photo',0,24,60,1,8000,'한옥 골목과 전통 먹거리'],
['보문호',35.8394,129.2862,'heal,photo',0,24,90,1,6000,'호수 둘레길과 카페'],
['읍천항 주상절리',35.7215,129.4768,'act,photo',0,24,60,2,5000,'파도소리길 해안 산책'],
['경주월드',35.8280,129.2840,'act',10,20,180,2,40000,'놀이공원, 가족 나들이'],
['국립경주박물관',35.8290,129.2275,'cult',10,18,90,1,0,'신라 금관과 성덕대왕신종'],
['분황사',35.8450,129.2330,'cult,heal',9,18,40,1,2000,'모전석탑이 있는 고찰']]}
};


const TAGS=['act','heal','food','cult','photo'];
const TAG_KO={act:'액티비티',heal:'힐링',food:'맛집',cult:'문화',photo:'포토'};
const LUNCH={tight:7000,mid:10000,lux:18000};
const WALKPEN={solo:.2,couple:.3,friends:.2,family:.6,parents:1};
const LV=['무료','저렴','보통','비쌈'];
const KEYMAP={'서울':'seoul','부산':'busan','제주':'jeju','강릉':'gangneung','전주':'jeonju','경주':'gyeongju','seoul':'seoul','busan':'busan','jeju':'jeju','gangneung':'gangneung','jeonju':'jeonju','gyeongju':'gyeongju'};
const COMP_KO={solo:'혼자',couple:'연인',friends:'친구',family:'가족',parents:'부모님'};
const PACE_KO={relaxed:'여유',normal:'보통',packed:'알차게'};
const BUD_KO={tight:'알뜰',mid:'보통',lux:'럭셔리'};

/* ===== 유틸 ===== */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fm=m=>{m=Math.round(m);return String(Math.floor(m/60)%24).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const wonF=n=>Number(n).toLocaleString('ko-KR')+'원';
const hrs=p=>p.open===0&&p.close===24?'24시간':fm(p.open*60)+'–'+(p.close>=24?'24:00':fm(p.close*60));
const inKorea=p=>p.lat>33&&p.lat<39&&p.lng>124&&p.lng<132;
const gmap=p=>'https://www.google.com/maps/search/?api=1&query='+p.lat+','+p.lng;
const nmap=p=>'https://map.naver.com/p/search/'+encodeURIComponent(p.name);
const gfood=p=>'https://www.google.com/maps/search/restaurants/@'+p.lat+','+p.lng+',16z';
const gdir=(base,order)=>{const q=p=>p.lat+','+p.lng,last=order[order.length-1],mid=order.slice(0,-1).map(q).join('|');
  return'https://www.google.com/maps/dir/?api=1&origin='+q(base)+'&destination='+q(last)+(mid?'&waypoints='+encodeURIComponent(mid):'')+'&travelmode='+(plan&&plan.f.move==='walk'?'walking':plan&&plan.f.move==='transit'?'transit':'driving')};
const title=p=>p.nameKo||p.name;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* ===== 간단 캐시 (localStorage) ===== */
function cacheGet(k){try{const o=JSON.parse(localStorage.getItem('howabout.c.'+k)||'null');if(o&&Date.now()-o.t<7*864e5)return o.v}catch(e){}return null}
function cacheSet(k,v){try{
  const keys=Object.keys(localStorage).filter(x=>x.startsWith('howabout.c.'));
  if(keys.length>12){keys.map(x=>[x,(JSON.parse(localStorage.getItem(x)||'{}').t||0)]).sort((a,b)=>a[1]-b[1]).slice(0,keys.length-10).forEach(x=>localStorage.removeItem(x[0]))}
  localStorage.setItem('howabout.c.'+k,JSON.stringify({t:Date.now(),v}))}catch(e){}}

/* ===== 장소 데이터: 내장(한국 6개 도시) ===== */
function curatedDataset(k){
  const c=CITY_DATA[k];
  const places=c.p.map((r,i)=>({id:'kr:'+k+i,key:'kr:'+k+i,name:r[0],lat:r[1],lng:r[2],tags:r[3].split(','),open:r[4],close:r[5],stay:r[6],walk:r[7],won:r[8],
    lv:r[8]===0?0:r[8]<=6000?1:r[8]<=15000?2:3,desc:r[9],pop:2,indoor:/박물관|스카이|월드|신세계|디자인플라자|전동성당|경기전/.test(r[0])}));
  return{label:c.n,center:c.c,places,curated:true,move:(k==='jeju'||k==='gangneung')?'car':'transit'};
}

/* ===== 장소 데이터: OpenStreetMap 기반(전 세계) ===== */
let lastNom=0;
async function geocode(q){
  const ck='geo:'+q.toLowerCase();const hit=cacheGet(ck);if(hit)return hit;
  let out;
  /* 브라우저에서 Nominatim을 직접 호출하면 CORS로 막힐 때가 있어서, Worker 주소가 있으면 그쪽을 거쳐 간다 */
  if(CFG.aiUrl){
    const r=await fetch(CFG.aiUrl+'/geocode?q='+encodeURIComponent(q));
    if(!r.ok)throw new Error('geocode '+r.status);
    const j=await r.json();
    out=(j.results||[]).map(x=>({name:x.name,lat:+x.lat,lng:+x.lng,bbox:x.bbox||[]}));
  }else{
    const wait=Math.max(0,lastNom+1100-Date.now());if(wait)await sleep(wait);lastNom=Date.now();
    const r=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ko&q='+encodeURIComponent(q));
    if(!r.ok)throw new Error('geocode '+r.status);
    const j=await r.json();
    out=j.map(x=>({name:x.display_name,lat:+x.lat,lng:+x.lon,bbox:(x.boundingbox||[]).map(Number)}));
  }
  if(out.length)cacheSet(ck,out);
  return out;
}
function autoRadius(g){
  const b=g.bbox;if(b.length<4)return 8000;
  const dLat=(b[1]-b[0])*111,dLng=(b[3]-b[2])*111*Math.cos(g.lat*Math.PI/180),diag=Math.hypot(dLat,dLng);
  /* 파리·도쿄처럼 큰 도시에서 무료 서버가 시간 초과되지 않도록 반경을 8km로 제한 */
  return Math.round(Math.min(8,Math.max(3,diag/2))*1000);
}
function overpassQuery(lat,lng,R,relaxed){
  const A='(around:'+R+','+lat+','+lng+')',W=relaxed?'':'["wikidata"]';
  return '[out:json][timeout:20];('+
   'nwr["tourism"~"^(attraction|museum|gallery|viewpoint|zoo|aquarium|theme_park)$"]["name"]'+A+';'+
   'nwr["historic"~"^(castle|palace|fort|monument|memorial|archaeological_site|ruins|temple|city_gate|manor)$"]["name"]'+W+A+';'+
   'nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"]'+W+A+';'+
   'nwr["natural"~"^(beach|peak|waterfall|hot_spring)$"]["name"]'+A+';'+
   'nwr["amenity"~"^(marketplace|place_of_worship)$"]["name"]["wikidata"]'+A+';'+
   'nwr["amenity"~"^(restaurant|cafe)$"]["name"]["wikidata"]'+A+';'+
   (relaxed?'nwr["amenity"~"^(restaurant|cafe)$"]["name"]["website"]["cuisine"]'+A+';':'')+
   'nwr["shop"="mall"]["name"]'+A+';'+
   ');out center tags 350;';
}
function classify(t){
  const to=t.tourism,hi=t.historic,le=t.leisure,na=t.natural,am=t.amenity;
  if(to==='museum'||to==='gallery')return{type:'museum',tags:['cult'],stay:90,walk:1,lv:2,hours:[10,18],indoor:true,desc:'박물관·미술관'};
  if(to==='zoo'||to==='aquarium'||to==='theme_park')return{type:to,tags:['act'],stay:180,walk:2,lv:3,hours:[10,18],indoor:to==='aquarium',desc:to==='zoo'?'동물원':to==='aquarium'?'수족관':'테마파크'};
  if(to==='viewpoint')return{type:'viewpoint',tags:['photo','heal'],stay:40,walk:2,lv:0,hours:[0,24],indoor:false,desc:'전망 명소'};
  if(to==='attraction')return{type:'attraction',tags:['photo','cult'],stay:60,walk:2,lv:1,hours:[0,24],indoor:false,desc:'대표 명소'};
  if(hi)return{type:'historic',tags:['cult','photo'],stay:60,walk:2,lv:1,hours:[9,18],indoor:false,desc:'역사 유적'};
  if(le==='park'||le==='garden'||le==='nature_reserve')return{type:'park',tags:['heal'],stay:70,walk:1,lv:0,hours:[0,24],indoor:false,desc:le==='garden'?'정원':'공원·자연'};
  if(na==='beach')return{type:'beach',tags:['heal','photo'],stay:80,walk:1,lv:0,hours:[0,24],indoor:false,desc:'해변'};
  if(na==='peak')return{type:'peak',tags:['act'],stay:180,walk:3,lv:0,hours:[0,24],indoor:false,desc:'산·전망'};
  if(na==='waterfall'||na==='hot_spring')return{type:na,tags:['photo','act'],stay:60,walk:2,lv:1,hours:[0,24],indoor:false,desc:na==='waterfall'?'폭포':'온천'};
  if(am==='marketplace')return{type:'market',tags:['food'],stay:60,walk:1,lv:1,hours:[8,20],indoor:false,desc:'시장'};
  if(am==='place_of_worship')return{type:'worship',tags:['cult'],stay:30,walk:1,lv:0,hours:[6,18],indoor:true,desc:'종교 건축'};
  if(am==='restaurant')return{type:'restaurant',tags:['food'],stay:70,walk:1,lv:2,hours:[11,21],indoor:true,desc:'식당'};
  if(am==='cafe')return{type:'cafe',tags:['food','heal'],stay:50,walk:1,lv:1,hours:[9,21],indoor:true,desc:'카페'};
  if(t.shop==='mall')return{type:'mall',tags:['food','photo'],stay:90,walk:1,lv:2,hours:[10,21],indoor:true,desc:'쇼핑몰'};
  return null;
}
function parseHours(s,def){
  if(!s)return def;
  if(/24\/7/.test(s))return[0,24];
  const seg=String(s).split(';')[0],all=[...seg.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];
  if(!all.length)return def;
  let o=99,c=0;
  all.forEach(m=>{const a=+m[1]+(+m[2])/60;let b=+m[3]+(+m[4])/60;if(b<=a)b=24;o=Math.min(o,a);c=Math.max(c,b)});
  return[o,Math.min(24,c)];
}
function osmPlace(el){
  const t=el.tags||{},c=classify(t);if(!c)return null;
  const lat=el.lat!=null?el.lat:el.center&&el.center.lat,lng=el.lon!=null?el.lon:el.center&&el.center.lon;
  if(lat==null||lng==null)return null;
  const name=t['name:ko']||t['name:en']||t.name;if(!name)return null;
  const h=parseHours(t.opening_hours,c.hours);
  let pop=(t.wikidata?3:0)+(t.wikipedia?2:0)+(t.heritage?1:0)+((t.website||t['contact:website'])?.5:0)+((t['name:ko']||t['name:en'])?.5:0)+(t.tourism==='attraction'?1:0)+(c.type==='museum'?.5:0);
  return{id:'osm:'+el.type+'/'+el.id,key:'osm:'+el.type+'/'+el.id,name,orig:t.name,lat,lng,tags:c.tags,type:c.type,open:h[0],close:h[1],stay:c.stay,walk:c.walk,won:null,lv:c.lv,desc:c.desc,pop,indoor:c.indoor,osm:true};
}
async function overpass(q){
  /* Worker 주소가 있으면 서버 쪽에서 여러 미러를 대신 시도한다 (브라우저 직접 호출은 CORS로 막힐 때가 있음) */
  if(CFG.aiUrl){
    const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),26000);
    try{
      const r=await fetch(CFG.aiUrl+'/overpass',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({q}),signal:ctl.signal});
      if(!r.ok)throw new Error('overpass '+r.status);
      const j=await r.json();
      if(!j||!Array.isArray(j.elements))throw new Error('overpass 빈 응답');
      return j;
    }finally{clearTimeout(to)}
  }
  const eps=['https://overpass-api.de/api/interpreter','https://overpass.private.coffee/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  let err;
  for(const ep of eps){
    try{
      const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),24000);
      const r=await fetch(ep,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q),signal:ctl.signal});
      clearTimeout(to);
      if(!r.ok)throw new Error('overpass '+r.status);
      const j=await r.json();
      if(!j||!Array.isArray(j.elements))throw new Error('overpass 빈 응답');
      return j;
    }catch(e){err=e}
  }
  throw err;
}
/* 위키백과 지오서치: 지도 서버(Overpass)가 막혔거나 결과가 적을 때 쓰는 보조 데이터. 조회수로 인기도, 한국어 문서 제목으로 한글 이름 */
const WIKI_BAD=/railway|metro|subway|station|airport|school|university|college|hospital|hotel|stadium|arena|company|football|sports club|commune|municipality|city in|town in|village|county|prefecture|ward of|neighbo(u)?rhood|quarter of|arrondissement|district of|\bband\b|album|\bfilm\b|television|politician|footballer|actor|singer|born/i;
const WIKI_CLS=[
 [/museum|gallery/i,{type:'museum',tags:['cult'],stay:90,walk:1,lv:2,hours:[10,18],indoor:true,desc:'박물관·미술관'}],
 [/zoo|aquarium|theme park|amusement/i,{type:'themepark',tags:['act'],stay:180,walk:2,lv:3,hours:[10,18],indoor:false,desc:'테마파크·동물원'}],
 [/church|cathedral|basilica|temple|shrine|mosque|monastery|abbey|synagogue|pagoda/i,{type:'worship',tags:['cult'],stay:40,walk:1,lv:0,hours:[8,18],indoor:true,desc:'종교 건축'}],
 [/castle|palace|fort|ruins|archaeological|historic|monument|memorial|gate|tomb|mausoleum|old town|heritage|cemetery|triumphal/i,{type:'historic',tags:['cult','photo'],stay:60,walk:2,lv:1,hours:[9,18],indoor:false,desc:'역사 유적'}],
 [/garden|park|botanical|nature reserve|forest|lake|river|canal|waterfall|island/i,{type:'park',tags:['heal'],stay:70,walk:1,lv:0,hours:[0,24],indoor:false,desc:'공원·자연'}],
 [/beach|bay/i,{type:'beach',tags:['heal','photo'],stay:80,walk:1,lv:0,hours:[0,24],indoor:false,desc:'해변'}],
 [/mountain|peak|hill|volcano/i,{type:'peak',tags:['act'],stay:180,walk:3,lv:0,hours:[0,24],indoor:false,desc:'산·전망'}],
 [/market|bazaar|shopping|department store/i,{type:'market',tags:['food'],stay:60,walk:1,lv:1,hours:[9,20],indoor:false,desc:'시장·쇼핑'}],
 [/tower|bridge|observation|skyscraper|square|plaza|landmark|arch\b|opera|theat(re|er)|library|boulevard|avenue|tourist|attraction/i,{type:'attraction',tags:['photo','cult'],stay:60,walk:2,lv:1,hours:[0,24],indoor:false,desc:'대표 명소'}]
];
async function wikiPlaces(g,radiusM){
  const R=Math.min(10000,Math.max(3000,radiusM)),sub=Math.round(R*.7),off=sub,dl=off/111320,dg=off/(111320*Math.cos(g.lat*Math.PI/180));
  const pts=[[g.lat,g.lng],[g.lat+dl,g.lng],[g.lat-dl,g.lng],[g.lat,g.lng+dg],[g.lat,g.lng-dg]];
  const res=await Promise.all(pts.map(p=>fetch('https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&origin=*&generator=geosearch&ggsnamespace=0&ggslimit=50&ggsradius='+sub+'&ggscoord='+p[0].toFixed(5)+'%7C'+p[1].toFixed(5)+'&prop=coordinates%7Cdescription%7Cpageviews%7Clanglinks&lllang=ko&lllimit=max&colimit=max')
    .then(r=>r.ok?r.json():null).catch(()=>null)));
  if(!res.some(Boolean))throw new Error('wikipedia 응답 없음');
  const seen={},out=[];
  res.forEach(j=>{
    let pages=j&&j.query&&j.query.pages;if(!pages)return;
    if(!Array.isArray(pages))pages=Object.values(pages);
    pages.forEach(pg=>{
      if(!pg||seen[pg.pageid])return;seen[pg.pageid]=1;
      const co=pg.coordinates&&pg.coordinates[0],desc=String(pg.description||'');
      if(!co||!desc||WIKI_BAD.test(desc))return;
      const hit=WIKI_CLS.find(c=>c[0].test(desc));if(!hit)return;
      const c=hit[1],ko=pg.langlinks&&pg.langlinks[0]&&(pg.langlinks[0].title||pg.langlinks[0]['*']);
      let v=0;if(pg.pageviews)for(const k in pg.pageviews)v+=pg.pageviews[k]||0;
      const pop=Math.max(0,Math.min(6,(Math.log10(1+v)-2.5)*1.6))+(ko?.8:0);
      out.push({id:'wp:'+pg.pageid,key:'wp:'+pg.pageid,name:ko||pg.title,orig:pg.title,lat:co.lat,lng:co.lon,tags:c.tags,type:c.type,open:c.hours[0],close:c.hours[1],stay:c.stay,walk:c.walk,won:null,lv:c.lv,desc:c.desc,pop,indoor:c.indoor,osm:true});
    });
  });
  return out;
}
function dedupe(list){
  const out=[];
  list.sort((a,b)=>b.pop-a.pop).forEach(p=>{
    const n=p.name.toLowerCase().replace(/\s+/g,'');
    if(!out.some(o=>o.name.toLowerCase().replace(/\s+/g,'')===n&&hav(o,p)<.4))out.push(p);
  });
  return out;
}
async function osmDataset(g,radiusM){
  const key='poi:'+g.lat.toFixed(2)+','+g.lng.toFixed(2)+','+radiusM;
  let places=cacheGet(key);
  if(!places){
    let list=[],err=null;
    try{
      const j=await overpass(overpassQuery(g.lat,g.lng,radiusM,false));
      list=dedupe((j.elements||[]).map(osmPlace).filter(Boolean));
    }catch(e){err=e}
    if(!err&&list.length<14){
      try{
        const j=await overpass(overpassQuery(g.lat,g.lng,Math.min(radiusM*1.5,15000),true));
        list=dedupe((j.elements||[]).map(osmPlace).filter(Boolean));
      }catch(e){err=e}
    }
    if(list.length<14){
      try{const w=await wikiPlaces(g,radiusM);list=dedupe(list.concat(w))}catch(e){err=err||e}
    }
    if(!list.length&&err)throw new Error('관광지 데이터 서버가 응답하지 않아요: '+(err.name==='AbortError'?'시간 초과':err.message));
    places=list.slice(0,90);
    if(places.length)cacheSet(key,places);
  }
  return{label:g.name.split(',')[0],center:[g.lat,g.lng],places,curated:false,move:'transit'};
}

/* ===== 취향·동선 계산 ===== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function tasteWeights(f,h){
  const W={act:1,heal:1,food:1,cult:1,photo:1},m=f.mbti;
  if(m[0]==='E'){W.act+=.45;W.food+=.2}else{W.heal+=.45;W.photo+=.2}
  if(m[1]==='N'){W.photo+=.3;W.cult+=.25}else{W.food+=.3;W.heal+=.15}
  if(m[2]==='T'){W.cult+=.3;W.act+=.15}else{W.photo+=.2;W.heal+=.3}
  const s=f.slider;if(s>0)W.act+=s*1.2;else W.heal+=-s*1.2;
  const C={solo:{photo:.2,cult:.1},couple:{photo:.3,heal:.2,food:.1},friends:{act:.3,food:.3},family:{heal:.2,act:-.1,food:.2},parents:{cult:.3,heal:.3,act:-.5}}[f.comp];
  for(const k in C)W[k]+=C[k];
  if(h&&h.w)for(const k in h.w)if(W[k]!=null)W[k]+=h.w[k];
  return W;
}
function hav(a,b){const r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r;const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2;return 12742*Math.asin(Math.sqrt(x))}
function scorePlace(p,W,f,rnd,h,base){
  let s=0;for(const t of p.tags)s+=W[t];s/=p.tags.length;
  s+=(rnd()-.5)*2*(f.mbti[3]==='P'?.9:.35);
  s-=WALKPEN[f.comp]*(p.walk-1)*.5;
  if(p.won!=null){const w=p.won/10000;s+=f.budget==='tight'?-w*.6:f.budget==='lux'?w*.2:-w*.08}
  else{const w=p.lv*.8;s+=f.budget==='tight'?-w*.5:f.budget==='lux'?w*.15:-w*.06}
  s+=.3*(p.pop||0);
  if(h){if(h.boost&&h.boost.has(p.id))s+=1.5;if(h.indoor)s+=p.indoor?.8:-1.2}
  if(f.move==='walk')s-=.25*Math.max(0,hav(base,p)*1.3-2.5);
  return s;
}
function pickPlaces(places,K,W,f,rnd,h,base){
  const sc=places.map(p=>({p,s:scorePlace(p,W,f,rnd,h,base)})),chosen=[],used={};
  while(chosen.length<K&&sc.length){
    let bi=-1,bs=-1e9;
    sc.forEach((o,i)=>{const v=o.s-.3*o.p.tags.reduce((a,t)=>a+(used[t]||0),0)/o.p.tags.length;if(v>bs){bs=v;bi=i}});
    const o=sc.splice(bi,1)[0];chosen.push(o.p);o.p.tags.forEach(t=>used[t]=(used[t]||0)+1);
  }
  return chosen;
}
function leg(a,b,mv){
  const km=hav(a,b)*1.35,wk=Math.round(km*13);
  /* 도보 위주여도 30분 넘게 걸어야 하는 구간은 대중교통으로 안내 */
  if(km<1.2||(mv==='walk'&&wk<=30))return{min:Math.max(mv==='walk'?2:3,wk),km,mode:'도보'};
  if(mv==='car')return{min:Math.round(6+km/34*60),km,mode:'차량'};
  return{min:Math.round(10+km/20*60),km,mode:'대중교통'};
}
function splitDays(list,D){
  if(D<=1||list.length<=1)return[list.slice()];
  const n=list.length,mla=list.reduce((a,p)=>a+p.lat,0)/n,mlo=list.reduce((a,p)=>a+p.lng,0)/n,kx=Math.cos(mla*Math.PI/180);
  let xx=0,yy=0,xy=0;
  list.forEach(p=>{const x=(p.lng-mlo)*kx,y=p.lat-mla;xx+=x*x;yy+=y*y;xy+=x*y});
  const th=.5*Math.atan2(2*xy,xx-yy),c=Math.cos(th),s=Math.sin(th);
  const sorted=list.slice().sort((a,b)=>((a.lng-mlo)*kx*c+(a.lat-mla)*s)-((b.lng-mlo)*kx*c+(b.lat-mla)*s));
  const base=Math.floor(n/D),rem=n%D,out=[];let i=0;
  for(let d=0;d<D;d++){const sz=base+(d<rem?1:0);out.push(sorted.slice(i,i+sz));i+=sz}
  return out.filter(g=>g.length);
}
function simulate(order,startMin,base,mv){
  let t=startMin,prev=base,lunch=false,travel=0,wait=0,viol=0;const rows=[];
  for(const p of order){
    if(!lunch&&prev!==base&&t>=690){rows.push({type:'lunch',start:t,end:t+60,at:prev});t+=60;lunch=true}
    const L=leg(prev,p,mv);travel+=L.min;t+=L.min;
    const isFood=p.tags.includes('food'),o=p.open*60,c=p.close*60;let w=0;
    if(t<o){w=o-t;wait+=w;t=o}
    let stay=p.stay,warn=false;
    if(t>c-30){viol++;warn=true}else if(t+stay>c){stay=c-t}
    if(isFood&&t>=660&&t<=870)lunch=true;
    rows.push({type:'stop',p,leg:L,arrive:t-w,start:t,end:t+stay,stay,wait:w,warn});
    t+=stay;prev=p;
  }
  return{rows,end:t,travel,wait,viol,lunch:rows.some(r=>r.type==='lunch')};
}
function orderCost(s,order){
  let c=s.travel+.6*s.wait+40*s.viol;
  order.forEach((p,i)=>{c+=(p.walk-1)*p.stay*.05;if(i&&p.walk>=3&&order[i-1].walk>=3)c+=25});
  if(s.end>1260)c+=(s.end-1260)*.5;
  return c;
}
function perms(a){if(a.length<=1)return[a.slice()];const r=[];a.forEach((x,i)=>{const rest=a.slice(0,i).concat(a.slice(i+1));perms(rest).forEach(p=>r.push([x].concat(p)))});return r}
function bestOrder(list,startMin,base,mv){
  let best=null,cnt=0,sumT=0;
  for(const o of perms(list)){const s=simulate(o,startMin,base,mv),c=orderCost(s,o);cnt++;sumT+=s.travel;if(!best||c<best.c)best={c,o,s}}
  return{order:best.o,sim:best.s,avgTravel:sumT/cnt};
}
function fatigue(s,order){
  let w=0;order.forEach(p=>w+=(p.walk-1)*p.stay*.3);
  const late=Math.max(0,s.end-1140)*.4;
  return Math.min(100,Math.round((s.travel*.8+w+late+order.length*4)/3));
}
function fatLabel(v){return v<=35?'여유':v<=60?'적당':v<=80?'빡빡':'고단'}
/* 도보 위주: 후보가 가장 많이 모인 곳을 중심으로 걸어갈 만한 반경 안의 장소만 쓴다 */
function walkCluster(pool,K){
  for(const R of [1.8,3,5,8,14]){
    let best=null;
    for(const c of pool){
      const m=pool.filter(p=>hav(c,p)<=R);
      if(m.length>=K){const sc=m.length+m.reduce((a,p)=>a+(p.pop||0),0)*.02;if(!best||sc>best.sc)best={sc,m}}
    }
    if(best){
      const n=best.m.length;
      return{pool:best.m,R,lat:best.m.reduce((a,p)=>a+p.lat,0)/n,lng:best.m.reduce((a,p)=>a+p.lng,0)/n};
    }
  }
  return null;
}
function planTrip(f,seed,ds,h){
  const rnd=mulberry32(seed),W=tasteWeights(f,h);
  let base={lat:ds.center[0],lng:ds.center[1],name:'숙소(도심)'},note='';
  let pool=ds.places.filter(p=>!(h&&h.exclude&&h.exclude.has(p.id)));
  const per={relaxed:3,normal:4,packed:5}[f.pace],K=Math.min(pool.length,f.days*per);
  if(K<1)return null;
  if(f.move==='walk'){
    const wc=walkCluster(pool,K);
    if(wc){pool=wc.pool;base={lat:wc.lat,lng:wc.lng,name:'숙소(도보권 중심)'};
      note=wc.R<=3?'도보 위주라서 걸어서 다닐 수 있는 반경 약 '+wc.R+'km 안의 장소만 골랐어요.':'걸어서 다닐 만한 곳이 모자라 반경 약 '+wc.R+'km까지 넓혔어요. 30분 넘게 걸리는 구간은 대중교통으로 안내해요.';}
    else note='도보권에 모여 있는 장소가 부족해서 30분 넘게 걸리는 구간은 대중교통으로 안내해요.';
  }
  const picked=pickPlaces(pool,K,W,f,rnd,h,base),groups=splitDays(picked,f.days);
  const cen=g=>hav(base,{lat:g.reduce((a,p)=>a+p.lat,0)/g.length,lng:g.reduce((a,p)=>a+p.lng,0)/g.length});
  groups.sort((a,b)=>cen(a)-cen(b));
  const hasCost=picked.every(p=>p.won!=null);
  const days=groups.map(g=>{
    const b=bestOrder(g,f.start,base,f.move),fat=fatigue(b.sim,b.order);
    const cost=hasCost?b.order.reduce((a,p)=>a+p.won,0)+(b.sim.lunch?LUNCH[f.budget]:0):null;
    return{order:b.order,sim:b.sim,fatigue:fat,avgTravel:b.avgTravel,cost};
  });
  const travel=days.reduce((a,d)=>a+d.sim.travel,0),saved=Math.max(0,Math.round(days.reduce((a,d)=>a+d.avgTravel,0)-travel));
  return{days,W,ds,base,note,all:ds.places,f,travel,saved,hasCost,
    fat:Math.round(days.reduce((a,d)=>a+d.fatigue,0)/days.length),
    cost:hasCost?days.reduce((a,d)=>a+d.cost,0):null,
    free:picked.filter(p=>p.lv===0).length,paid:picked.filter(p=>p.lv>0).length};
}

/* ===== 조건 해석: 기본 해석(키워드) + AI(Worker) ===== */
function localHints(text){
  const t=(text||'').toLowerCase(),h={w:{},notes:[],boost:new Set(),exclude:new Set(),indoor:false,src:'local'};
  const add=(k,v,n)=>{h.w[k]=(h.w[k]||0)+v;h.notes.push(n)};
  if(/실내|비\s*오|우천|rain|indoor/.test(t)){h.indoor=true;h.notes.push('실내 위주')}
  if(/맛집|먹|음식|미식|food/.test(t))add('food',.9,'맛집 비중 올림');
  if(/사진|감성|인스타|포토|photo/.test(t))add('photo',.9,'포토 스폿 비중 올림');
  if(/조용|힐링|휴식|여유|산책|relax|quiet/.test(t))add('heal',.9,'힐링 비중 올림');
  if(/액티비티|체험|등산|트레킹|활동|스포츠|adventure|hike/.test(t))add('act',.9,'액티비티 비중 올림');
  if(/역사|문화|박물관|미술|전시|유적|museum|history|culture/.test(t))add('cult',.9,'문화 비중 올림');
  if(/아이|아기|어린이|키즈|kids?|child/.test(t)){h.comp='family';h.notes.push('아이 동반으로 이해')}
  else if(/부모님|어르신|노부모|할머니|할아버지|elder|parents/.test(t)){h.comp='parents';h.notes.push('부모님과 동행으로 이해')}
  else if(/연인|커플|데이트|신혼|couple|honeymoon/.test(t)){h.comp='couple';h.notes.push('연인과 동행으로 이해')}
  else if(/혼자|솔로|solo/.test(t)){h.comp='solo';h.notes.push('혼자 여행으로 이해')}
  else if(/친구|friends/.test(t)){h.comp='friends';h.notes.push('친구와 동행으로 이해')}
  if(/느긋|천천히|여유롭|slow/.test(t)){h.pace='relaxed';h.notes.push('여유로운 템포')}
  else if(/알차|빡빡|꽉|많이 보|packed/.test(t)){h.pace='packed';h.notes.push('알찬 템포')}
  if(/저렴|알뜰|가성비|무료|싸게|cheap|budget/.test(t)){h.budget='tight';h.notes.push('알뜰 예산')}
  else if(/럭셔리|고급|프리미엄|luxury/.test(t)){h.budget='lux';h.notes.push('럭셔리 예산')}
  if(/걷지 않|덜 걷|적게 걷|많이 걷지/.test(t)){h.pace=h.pace||'relaxed';h.notes.push('걷기 적게')}
  return h;
}
async function askAI(ds,cond,f){
  const cands=ds.places.slice().sort((a,b)=>(b.pop||0)-(a.pop||0)).slice(0,45).map(p=>({id:p.id,n:p.name,c:p.tags.join('/'),t:p.type||''}));
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),25000);
  try{
    const r=await fetch(CFG.aiUrl,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({dest:ds.label,cond:cond||'',profile:{mbti:f.mbti,comp:f.comp,budget:f.budget,pace:f.pace,days:f.days},cands}),signal:ctl.signal});
    if(!r.ok)throw new Error('ai '+r.status);
    return await r.json();
  }finally{clearTimeout(to)}
}
function mergeAI(h,a,ds){
  const ids=new Set(ds.places.map(p=>p.id)),W=['act','heal','food','cult','photo'];
  h.src='ai';h.notes=[];
  if(a.summary)h.notes.push(String(a.summary).slice(0,120));
  if(a.weights&&typeof a.weights==='object'){h.w={};W.forEach(k=>{const v=+a.weights[k];if(isFinite(v))h.w[k]=Math.max(-1,Math.min(1.2,(v-1)*.8))})}
  if(typeof a.indoor==='boolean')h.indoor=a.indoor;
  ['boost','exclude'].forEach(k=>{if(Array.isArray(a[k]))h[k]=new Set(a[k].filter(x=>ids.has(x)))});
  if(a.comp&&COMP_KO[a.comp])h.comp=a.comp;else delete h.comp;
  if(a.pace&&PACE_KO[a.pace])h.pace=a.pace;else delete h.pace;
  if(a.budget&&BUD_KO[a.budget])h.budget=a.budget;else delete h.budget;
  ds.places.forEach(p=>{
    if(a.names&&typeof a.names[p.id]==='string')p.nameKo=a.names[p.id].slice(0,40);
    if(a.desc&&typeof a.desc[p.id]==='string')p.desc=a.desc[p.id].slice(0,60);
  });
  return h;
}

/* ===== 상태 ===== */
const OPT={
 days:[[1,'1일'],[2,'2일'],[3,'3일']],
 start:[[510,'아침형 08:30'],[570,'보통 09:30'],[630,'느긋 10:30']],
 pace:[['relaxed','여유'],['normal','보통'],['packed','알차게']],
 budget:[['tight','알뜰'],['mid','보통'],['lux','럭셔리']],
 comp:[['solo','혼자'],['couple','연인'],['friends','친구'],['family','가족'],['parents','부모님']],
 move:[['transit','대중교통'],['car','자차·렌터카'],['walk','도보 위주']],
 radius:[['auto','자동'],['5','5km'],['10','10km'],['20','20km']]
};
const MB=[['E','외향','I','내향'],['N','직관','S','감각'],['T','사고','F','감정'],['J','계획','P','즉흥']];
const DEF={days:2,start:570,pace:'normal',budget:'mid',comp:'friends',pax:2,mbti:'ENFP',slider:0,move:'transit',radius:'auto'};
let f=Object.assign({},DEF),q='서울',cond='',seed=7,ds=null,hints=localHints(''),plan=null,dayFilter=-1,sel=null,runId=0,geoAlts=[];
try{
  const s=JSON.parse(localStorage.getItem('howabout.v2')||'null');
  if(s&&s.f&&/^[EI][NS][TF][JP]$/.test(s.f.mbti||'')){f=Object.assign(f,s.f);q=s.q||q;cond=s.cond||'';seed=s.seed|0||seed}
}catch(e){}
const save=()=>{try{localStorage.setItem('howabout.v2',JSON.stringify({f,q,cond,seed}))}catch(e){}};

/* ===== 패널 ===== */
function seg(k,label,arr,cls){
  return'<div class="g"><span class="lb">'+label+'</span><div class="seg '+(cls||'')+'" role="group" aria-label="'+label+'">'+
   arr.map(([v,t])=>'<button type="button" data-k="'+k+'" data-v="'+v+'" aria-pressed="'+(String(f[k])===String(v))+'">'+t+'</button>').join('')+'</div></div>';
}
function buildPanel(){
  const quick=Object.keys(CITY_DATA).map(k=>'<button type="button" class="qc" data-q="'+CITY_DATA[k].n+'">'+CITY_DATA[k].n+'</button>').join('');
  $('#panel').innerHTML=
   '<div class="g wide"><label for="dest">여행지 검색 (전 세계)</label>'+
   '<input id="dest" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" placeholder="예: 도쿄, 파리, 제주 애월, Barcelona" value="'+esc(q)+'">'+
   '<div class="chips2" id="quick" aria-label="바로 가기">'+quick+'</div>'+
   '<label for="cond" style="margin-top:6px">원하는 조건</label>'+
   '<textarea id="cond" rows="3" maxlength="300" placeholder="예: 비 오는 날 실내 위주, 아이와 함께, 맛집 많이, 너무 걷지 않게">'+esc(cond)+'</textarea>'+
   '<button class="btn pri" id="go" type="button">'+(CFG.aiUrl?'AI로 일정 짜기':'조건대로 일정 짜기')+'</button>'+
   '<div class="mbnote" id="status" role="status"></div><div class="chips2" id="alts"></div><div class="mbnote" id="hintnote"></div></div>'+
   seg('days','기간',OPT.days)+seg('start','하루 시작',OPT.start)+
   '<div class="g mb"><span class="lb">MBTI</span><div class="mbig" id="mbig"></div>'+
   MB.map((r,i)=>'<div class="seg" role="group" aria-label="'+r[0]+r[2]+'">'+[0,2].map(j=>'<button type="button" data-m="'+i+'" data-v="'+r[j]+'" aria-pressed="'+(f.mbti[i]===r[j])+'">'+r[j]+' '+r[j+1]+'</button>').join('')+'</div>').join('')+
   '<div class="mbnote" id="mbnote"></div></div>'+
   '<div class="g"><span class="lb">내 취향 레이더</span><div class="bars" id="bars"></div>'+
   '<label for="sl" style="margin-top:6px;text-transform:none;letter-spacing:0;font-size:13px">직접 조절: 액티비티와 힐링</label>'+
   '<input id="sl" type="range" min="-10" max="10" step="1" value="'+Math.round(f.slider*10)+'" aria-label="액티비티와 힐링 비중"><div class="rl"><span>힐링 쪽</span><span>MBTI 기준</span><span>액티비티 쪽</span></div></div>'+
   seg('pace','템포',OPT.pace)+seg('budget','예산',OPT.budget)+seg('comp','동행',OPT.comp,'wrap')+seg('move','이동수단',OPT.move)+seg('radius','탐색 반경(해외·직접 검색)',OPT.radius)+
   '<div class="g"><span class="lb">인원</span><div class="stp"><button type="button" data-pax="-1" aria-label="인원 줄이기">−</button><output id="pax">'+f.pax+'명</output><button type="button" data-pax="1" aria-label="인원 늘리기">+</button></div></div>'+
   '<div class="g"><button class="btn" type="button" id="goRes">결과 보기</button></div>';
}
function syncPressed(){
  $$('#panel [data-k]').forEach(b=>b.setAttribute('aria-pressed',String(f[b.dataset.k])===b.dataset.v));
  $$('#panel [data-m]').forEach(b=>b.setAttribute('aria-pressed',f.mbti[+b.dataset.m]===b.dataset.v));
  $('#mbig').textContent=f.mbti;$('#pax').textContent=f.pax+'명';
}
function renderTaste(){
  const W=tasteWeights(f,hints),mx=Math.max(...TAGS.map(t=>W[t])),m=f.mbti;
  $('#bars').innerHTML=TAGS.map(t=>'<div class="tb"><span>'+TAG_KO[t]+'</span><i style="--v:'+Math.round(Math.max(.08,W[t]/mx)*100)+'%"></i></div>').join('');
  $('#mbnote').textContent=(m[0]==='E'?'사람 많고 활기찬 곳':'조용하고 여유로운 곳')+'과 '+(m[1]==='N'?'감성과 이야기가 있는 곳':'확실한 먹거리와 편안함')+' 위주로 고르고, '+(m[3]==='P'?'즉흥적인 변수를 크게':'안정적인 구성으로')+' 뽑아요.';
}
const setStatus=(t,bad)=>{const e=$('#status');e.textContent=t;e.classList.toggle('bad',!!bad)};

/* ===== 지도 (MapLibre + OpenFreeMap) ===== */
let map=null,mapLoaded=false,pendingMap=null,markers=[];
function initMap(){
  if(map)return;
  if(!window.maplibregl){$('#mapnote').hidden=false;return}
  try{
    map=new maplibregl.Map({container:'map',style:CFG.mapStyle,center:[127.0,37.55],zoom:9,attributionControl:{compact:true}});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
    map.on('load',()=>{mapLoaded=true;if(pendingMap){const fn=pendingMap;pendingMap=null;fn()}});
    let warned=false;
    map.on('error',()=>{if(!warned&&!mapLoaded){warned=true;$('#mapnote').hidden=false}});
  }catch(e){map=null;$('#mapnote').hidden=false}
}
const DAYCOL=()=>['--d0','--d1','--d2'].map(v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim()||'#1D7F8C');
function drawMap(){
  if(!plan)return;
  initMap();if(!map)return;
  markers.forEach(m=>m.remove());markers=[];
  const vis=plan.days.map((d,i)=>dayFilter<0||dayFilter===i),pts=[];
  const bel=document.createElement('div');bel.innerHTML='<div class="mk base" title="숙소(도심 기준)"></div>';
  markers.push(new maplibregl.Marker({element:bel}).setLngLat([plan.base.lng,plan.base.lat]).addTo(map));
  plan.days.forEach((d,i)=>{
    if(!vis[i])return;
    d.order.forEach((p,j)=>{
      const el=document.createElement('div'),inner=document.createElement('div');
      inner.className='mk d'+i+(sel&&sel[0]===i&&sel[1]===j?' on':'');inner.textContent=j+1;inner.dataset.i=i;inner.dataset.j=j;
      inner.setAttribute('role','button');inner.setAttribute('aria-label',(i+1)+'일차 '+(j+1)+'번 '+title(p));inner.tabIndex=0;
      inner.addEventListener('click',ev=>{ev.stopPropagation();selectStop(i,j,true)});
      inner.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();selectStop(i,j,true)}});
      el.appendChild(inner);
      markers.push(new maplibregl.Marker({element:el}).setLngLat([p.lng,p.lat]).addTo(map));
      pts.push([p.lng,p.lat]);
    });
  });
  const col=DAYCOL();
  const fc={type:'FeatureCollection',features:plan.days.map((d,i)=>({type:'Feature',properties:{day:i,color:col[i%3]},
    geometry:{type:'LineString',coordinates:[[plan.base.lng,plan.base.lat]].concat(d.order.map(p=>[p.lng,p.lat]))}}))};
  const apply=()=>{
    const s=map.getSource('routes');
    if(s)s.setData(fc);
    else{
      map.addSource('routes',{type:'geojson',data:fc});
      map.addLayer({id:'route-casing',type:'line',source:'routes',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#ffffff','line-width':9,'line-opacity':.95}});
      map.addLayer({id:'route',type:'line',source:'routes',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':['get','color'],'line-width':5}});
    }
    const flt=dayFilter<0?null:['==',['get','day'],dayFilter];
    map.setFilter('route-casing',flt);map.setFilter('route',flt);
  };
  if(mapLoaded)apply();else pendingMap=apply;
  const b=new maplibregl.LngLatBounds([plan.base.lng,plan.base.lat],[plan.base.lng,plan.base.lat]);
  pts.forEach(p=>b.extend(p));
  try{map.fitBounds(b,{padding:{top:56,bottom:56,left:56,right:56},maxZoom:15,duration:500})}catch(e){}
}

/* ===== 결과 렌더링 ===== */
function dayHTML(d,i){
  const P=plan;
  let h='<section class="day d'+i+'" data-day="'+i+'"'+(dayFilter>=0&&dayFilter!==i?' hidden':'')+'><header class="dh"><h3>DAY '+(i+1)+'</h3><div class="dm"><span>'+fm(P.f.start)+' 출발 · '+fm(d.sim.end)+' 마무리</span><span>이동 '+d.sim.travel+'분</span>'+(d.cost!=null?'<span>1인 약 '+wonF(d.cost)+'</span>':'')+'</div></header>';
  h+='<div class="fat"><span>피로도 '+d.fatigue+' '+fatLabel(d.fatigue)+'</span><i><b style="width:'+d.fatigue+'%"></b></i></div>';
  const rows=d.sim.rows;let j=-1;
  rows.forEach((r,idx)=>{
    const last=idx===rows.length-1,cls=(j<0?' first':'')+(last?' last':'');
    if(r.type==='lunch'){
      h+='<div class="row lunch'+cls+'"><div class="tm">'+fm(r.start)+'<small>–'+fm(r.end)+'</small></div><div class="rail"><s></s></div><div class="sc"><h4 style="font-weight:500">점심 식사</h4><div class="mt"><span>60분</span>'+(P.hasCost?'<span>1인 약 '+wonF(LUNCH[P.f.budget])+'</span>':'')+'</div><div class="lk"><a href="'+gfood(r.at)+'" target="_blank" rel="noopener">근처 식당 찾기</a></div></div></div>';
      return;
    }
    const first=j<0;j++;const p=r.p;
    h+='<div class="row'+(first?' nol':'')+'"><div></div><div class="rail"></div><div class="leg">'+(first?'숙소에서':'이전 장소에서')+' '+r.leg.mode+' '+r.leg.min+'분 · '+r.leg.km.toFixed(1)+'km</div></div>';
    h+='<div class="row stop'+(first?' first':'')+(last?' last':'')+'" data-i="'+i+'" data-j="'+j+'"><div class="tm">'+fm(r.start)+'<small>–'+fm(r.end)+'</small></div><div class="rail"><b>'+(j+1)+'</b></div><div class="sc"><h4>'+esc(title(p))+'</h4>'+
      (p.nameKo&&p.nameKo!==p.name?'<div class="ds">'+esc(p.name)+'</div>':'')+'<div class="ds">'+esc(p.desc||'')+'</div>'+
      '<div class="tg">'+p.tags.map(t=>'<span>'+TAG_KO[t]+'</span>').join('')+(r.warn?'<span class="w">마감 임박</span>':'')+(r.wait?'<span class="w">개장 대기 '+r.wait+'분</span>':'')+'</div>'+
      '<div class="mt"><span>운영 '+hrs(p)+(p.osm?' (추정 포함)':'')+'</span><span>'+r.stay+'분 머물기</span><span>'+(p.won!=null?'1인 약 '+wonF(p.won):'비용 '+LV[p.lv])+'</span><span data-rc="'+esc(p.key)+'"></span></div>'+
      '<div class="lk"><a href="'+gmap(p)+'" target="_blank" rel="noopener">구글 지도</a>'+(inKorea(p)?'<a href="'+nmap(p)+'" target="_blank" rel="noopener">네이버 지도</a>':'')+'<button type="button" data-rv="'+esc(p.key)+'">후기</button></div></div></div>';
  });
  h+='<div class="lk" style="margin-top:10px"><a class="rt" href="'+gdir(P.base,d.order)+'" target="_blank" rel="noopener">이 날 경유지 길찾기 (구글 지도)</a></div></section>';
  return h;
}
function render(){
  const P=plan;
  if(!P){$('#sum').innerHTML='';$('#days').innerHTML='';$('#tabs').innerHTML='';$('#plannote').textContent='';return}
  const f2=P.f;
  $('#plannote').textContent=P.note||'';
  $('#chips').innerHTML=[P.ds.label,f2.days+'일',f2.mbti,COMP_KO[f2.comp]+' '+f2.pax+'명',BUD_KO[f2.budget]+' 예산'].map(t=>'<span>'+esc(t)+'</span>').join('');
  $('#sum').innerHTML='<div><b>'+P.travel+'분</b><small>총 이동시간</small></div><div><b>'+P.saved+'분</b><small>임의 순서보다 절약</small></div><div><b>'+P.fat+' '+fatLabel(P.fat)+'</b><small>평균 피로도</small></div>'+
    (P.hasCost?'<div><b>'+wonF(P.cost*f2.pax)+'</b><small>'+f2.pax+'명 예상 (입장·식비)</small></div>':'<div><b>유료 '+P.paid+'곳</b><small>무료 '+P.free+'곳 · 현지 요금은 직접 확인</small></div>');
  $('#tabs').innerHTML='<button type="button" data-tab="-1" aria-pressed="'+(dayFilter<0)+'">전체</button>'+P.days.map((d,i)=>'<button type="button" data-tab="'+i+'" aria-pressed="'+(dayFilter===i)+'">'+(i+1)+'일차</button>').join('');
  $('#days').innerHTML=P.days.map(dayHTML).join('');
  drawMap();refreshBadges();
}
function applyHintsToForm(){
  const ch=[];
  if(hints.comp&&hints.comp!==f.comp){f.comp=hints.comp;ch.push('동행 '+COMP_KO[f.comp])}
  if(hints.pace&&hints.pace!==f.pace){f.pace=hints.pace;ch.push('템포 '+PACE_KO[f.pace])}
  if(hints.budget&&hints.budget!==f.budget){f.budget=hints.budget;ch.push('예산 '+BUD_KO[f.budget])}
  return ch;
}
function replan(){
  if(!ds)return;
  plan=planTrip(f,seed,ds,hints);
  if(plan&&dayFilter>=plan.days.length)dayFilter=-1;
  sel=null;syncPressed();renderTaste();render();save();
}
function selectStop(i,j,scroll){
  sel=[i,j];$$('.stop.on').forEach(e=>e.classList.remove('on'));$$('.mk.on').forEach(e=>e.classList.remove('on'));
  const row=document.querySelector('.stop[data-i="'+i+'"][data-j="'+j+'"]'),mk=document.querySelector('.mk[data-i="'+i+'"][data-j="'+j+'"]');
  if(row){row.classList.add('on');if(scroll)row.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'})}
  if(mk)mk.classList.add('on');
  if(map&&plan){const p=plan.days[i]&&plan.days[i].order[j];if(p)try{map.easeTo({center:[p.lng,p.lat],duration:400})}catch(e){}}
}

/* ===== 검색 실행 ===== */
async function run(opts){
  opts=opts||{};
  const my=++runId;
  q=($('#dest').value||'').trim();cond=($('#cond').value||'').trim();
  if(!q){setStatus('여행지를 입력해 주세요.',true);return}
  $('#go').disabled=true;$('#alts').innerHTML='';
  try{
    const key=KEYMAP[q.toLowerCase()];
    let next;
    if(key&&!opts.geo){setStatus('내장 데이터로 찾는 중이에요...');next=curatedDataset(key);if(f.move==='transit'&&next.move==='car'&&!opts.keepMove)f.move='car';else if(next.move==='transit'&&f.move==='car'&&!opts.keepMove)f.move='transit'}
    else{
      setStatus('"'+q+'" 위치를 찾는 중이에요...');
      let g=opts.geo;
      if(!g){const list=await geocode(q);if(my!==runId)return;if(!list.length){setStatus('검색 결과가 없어요. 도시 이름으로 다시 검색해 보세요.',true);return}geoAlts=list;g=list[0]}
      const rad=f.radius==='auto'?autoRadius(g):(+f.radius)*1000;
      setStatus('주변 관광지를 모으는 중이에요. 최대 30초 걸릴 수 있어요...');
      next=await osmDataset(g,rad);if(my!==runId)return;
      if(geoAlts.length>1)$('#alts').innerHTML='<span class="mbnote">다른 지역이면 선택:</span>'+geoAlts.slice(0,4).map((a,i)=>'<button type="button" class="qc" data-alt="'+i+'">'+esc(a.name.split(',').slice(0,2).join(','))+'</button>').join('');
      if(next.places.length<3){setStatus('후보지를 거의 찾지 못했어요. 탐색 반경을 넓히거나 더 큰 도시로 검색해 보세요.',true);return}
    }
    ds=next;dayFilter=-1;
    hints=localHints(cond);
    let aiFail=false;
    if(CFG.aiUrl&&(cond||!ds.curated)){
      setStatus('AI가 조건을 해석하는 중이에요...');
      try{const a=await askAI(ds,cond,f);if(my!==runId)return;hints=mergeAI(hints,a,ds)}catch(e){aiFail=e&&e.message||'오류';if(my!==runId)return}
    }
    const ch=applyHintsToForm();
    plan=null;replan();
    if(!plan){setStatus('일정을 만들 장소가 부족해요.',true);return}
    setStatus('"'+ds.label+'" 일정을 만들었어요.'+(aiFail?' AI 연결에 실패해서 기본 해석으로 만들었어요. ('+aiFail+')':''),false);
    const notes=hints.notes.slice();if(ch.length)notes.push('조건에 맞춰 바꾼 항목: '+ch.join(', '));
    $('#hintnote').textContent=notes.length?(hints.src==='ai'?'AI 해석: ':'기본 해석: ')+notes.join(' · '):'';
    if(opts.scroll&&matchMedia('(max-width:999px)').matches)$('#results').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    const m=e&&e.message?e.message:'오류';
    if(my===runId)setStatus(/^geocode/.test(m)||/Failed to fetch|NetworkError|Load failed/i.test(m)?'위치 검색 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요. ('+m+')':'불러오지 못했어요. 잠시 뒤 다시 시도해 주세요. ('+m+')',true);
  }finally{if(my===runId)$('#go').disabled=false}
}

/* ===== 후기 (Firebase Firestore) ===== */
let FB=null,curKey=null,curReviews=[],curTitle='',starVal=0;
async function fbInit(){
  const c=CFG.firebase;
  if(!c||!c.apiKey||!c.projectId)return;
  try{
    const B='https://www.gstatic.com/firebasejs/11.0.2/';
    const [a,au,fs]=await Promise.all([import(B+'firebase-app.js'),import(B+'firebase-auth.js'),import(B+'firebase-firestore.js')]);
    const app=a.initializeApp(c),auth=au.getAuth(app),cred=await au.signInAnonymously(auth);
    FB={db:fs.getFirestore(app),fs,uid:cred.user.uid};
  }catch(e){FB=null;console.warn('firebase',e)}
  refreshBadges();
}
function refreshBadges(){document.body.classList.toggle('no-db',!FB)}
const STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z" stroke-linejoin="round"/></svg>';
const placeByKey=k=>{if(!plan)return null;for(const d of plan.days)for(const p of d.order)if(p.key===k)return p;return plan.all.find(p=>p.key===k)||null};
const simL=(a,b)=>[0,1,2,3].filter(i=>a[i]===b[i]).length;
async function openSheet(key){
  curKey=key;starVal=0;curReviews=[];
  const p=placeByKey(key);curTitle=p?title(p):'후기';
  $('#sheetwrap').hidden=false;renderSheet(true);$('#shX').focus();
  try{
    const {collection,query,where,limit,getDocs}=FB.fs;
    const snap=await getDocs(query(collection(FB.db,'reviews'),where('placeKey','==',key),limit(40)));
    if(curKey!==key)return;
    curReviews=snap.docs.map(d=>Object.assign({id:d.id},d.data())).sort((a,b)=>((b.ts&&b.ts.toMillis?b.ts.toMillis():0)-(a.ts&&a.ts.toMillis?a.ts.toMillis():0)));
    renderSheet(false);
  }catch(e){if(curKey===key){renderSheet(false,'후기를 불러오지 못했어요.')}}
}
function renderSheet(loading,err){
  $('#shT').textContent=curTitle;
  const b=$('#shB');b.textContent='';
  const head=document.createElement('div');head.className='mt';
  const l=curReviews,avg=l.length?(l.reduce((a,r)=>a+(r.rating||0),0)/l.length).toFixed(1):null;
  head.textContent=loading?'불러오는 중...':err?err:avg?'평균 ★'+avg+' · 후기 '+l.length+'개':'아직 후기가 없어요';
  b.appendChild(head);
  const list=document.createElement('div');list.style.display='grid';list.style.gap='10px';
  l.forEach(r=>{
    const d=document.createElement('div');d.className='rv';
    const who=document.createElement('div');who.className='who';
    const nm=document.createElement('b');nm.textContent='여행자';who.appendChild(nm);
    const mb=document.createElement('span');mb.textContent=String(r.mbti||'').slice(0,4);who.appendChild(mb);
    const st=document.createElement('span');st.textContent='★'.repeat(Math.max(0,Math.min(5,r.rating|0)));st.style.color='var(--d1)';who.appendChild(st);
    if(r.mbti&&simL(String(r.mbti),f.mbti)>=3){const t=document.createElement('span');t.textContent='나와 비슷한 성향';t.style.color='var(--accent)';who.appendChild(t)}
    if(FB&&r.uid===FB.uid){const x=document.createElement('button');x.type='button';x.className='sm';x.textContent='삭제';
      x.onclick=async()=>{try{await FB.fs.deleteDoc(FB.fs.doc(FB.db,'reviews',r.id));curReviews=curReviews.filter(z=>z.id!==r.id);renderSheet(false)}catch(e){flash('삭제하지 못했어요.')}};who.appendChild(x)}
    d.appendChild(who);const t=document.createElement('p');t.textContent=String(r.text||'');d.appendChild(t);list.appendChild(d);
  });
  b.appendChild(list);
  if(loading)return;
  const form=document.createElement('div');form.style.display='grid';form.style.gap='8px';
  const lab=document.createElement('div');lab.className='mt';lab.textContent='내 후기 남기기 ('+f.mbti+')';form.appendChild(lab);
  const stars=document.createElement('div');stars.className='stars';
  for(let k=1;k<=5;k++){const s=document.createElement('button');s.type='button';s.setAttribute('aria-label','별 '+k+'점');s.innerHTML=STAR;if(k<=starVal)s.classList.add('on');
    s.onclick=()=>{starVal=k;[...stars.children].forEach((c,i)=>c.classList.toggle('on',i<k))};stars.appendChild(s)}
  form.appendChild(stars);
  const ta=document.createElement('textarea');ta.maxLength=200;ta.placeholder='한 줄 후기 (200자 이내)';ta.setAttribute('aria-label','후기 내용');form.appendChild(ta);
  const msg=document.createElement('div');msg.className='note';msg.hidden=true;
  const go=document.createElement('button');go.type='button';go.className='btn pri';go.textContent='후기 등록';
  go.onclick=async()=>{
    const text=ta.value.trim();
    if(!starVal||!text){msg.hidden=false;msg.textContent='별점과 후기 내용을 모두 입력해 주세요.';return}
    go.disabled=true;
    try{
      const {collection,addDoc,serverTimestamp}=FB.fs;
      const ref=await addDoc(collection(FB.db,'reviews'),{placeKey:curKey,rating:starVal,text:text.slice(0,200),mbti:f.mbti,uid:FB.uid,ts:serverTimestamp()});
      curReviews.unshift({id:ref.id,placeKey:curKey,rating:starVal,text:text.slice(0,200),mbti:f.mbti,uid:FB.uid});
      starVal=0;renderSheet(false);
    }catch(e){msg.hidden=false;msg.textContent='등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.'}
    go.disabled=false;
  };
  form.appendChild(go);form.appendChild(msg);b.appendChild(form);
}
function closeSheet(){$('#sheetwrap').hidden=true;curKey=null}

/* ===== 내보내기 (엑셀 / PDF) ===== */
const EXPORT_STYLE='.d0{--c:#1D7F8C}.d1{--c:#BF7D14}.d2{--c:#8446D0}.mp-bg{fill:#E6EDF3}.mp-grid{stroke:#D2DCE5;stroke-width:1;fill:none}.mp-dot{fill:#9FB0BF}.mp-line{fill:none;stroke:var(--c);stroke-width:4;stroke-linejoin:round;stroke-linecap:round}.mp-leg0{fill:none;stroke:var(--c);stroke-width:2;stroke-dasharray:2 6;stroke-linecap:round;opacity:.8}.mp-arr{fill:var(--c)}.mp-pin circle{fill:var(--c);stroke:#E6EDF3;stroke-width:3}.mp-pin .mp-n{fill:#fff;font:400 16px sans-serif;text-anchor:middle;dominant-baseline:central}.mp-lbl{font:700 14px sans-serif;fill:#0F1B26;paint-order:stroke;stroke:#E6EDF3;stroke-width:4px;stroke-linejoin:round}.mp-base rect{fill:#0F1B26}.mp-base text{font:700 12px sans-serif;fill:#0F1B26;paint-order:stroke;stroke:#E6EDF3;stroke-width:4px}.mp-scale{stroke:#0F1B26;stroke-width:2;fill:none}.mp-st{font:500 12px monospace;fill:#0F1B26}';
function exportSVG(P){
  const W=640,H=400,pad=50,pts=[P.base];P.days.forEach(d=>d.order.forEach(p=>pts.push(p)));
  const kx=Math.cos(P.base.lat*Math.PI/180),X=p=>p.lng*kx,Y=p=>-p.lat;
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  pts.forEach(p=>{x0=Math.min(x0,X(p));x1=Math.max(x1,X(p));y0=Math.min(y0,Y(p));y1=Math.max(y1,Y(p))});
  const dx=Math.max(x1-x0,.01),dy=Math.max(y1-y0,.01),s=Math.min((W-2*pad)/dx,(H-2*pad)/dy);
  const ox=(W-dx*s)/2-x0*s,oy=(H-dy*s)/2-y0*s,px=p=>X(p)*s+ox,py=p=>Y(p)*s+oy,pxkm=s/111;
  const nice=[.5,1,2,5,10,20,50,100].filter(k=>k*pxkm<=130).pop()||.5,g=nice*pxkm;
  let h='<svg width="1280" height="800" viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg"><style>'+EXPORT_STYLE+'</style><rect class="mp-bg" width="'+W+'" height="'+H+'"/>';
  if(g>=12){for(let x=ox%g;x<W;x+=g)h+='<path class="mp-grid" d="M'+x.toFixed(1)+' 0V'+H+'"/>';for(let y=oy%g;y<H;y+=g)h+='<path class="mp-grid" d="M0 '+y.toFixed(1)+'H'+W+'"/>'}
  P.days.forEach((d,i)=>{
    const o=d.order;
    h+='<g class="d'+i+'"><path class="mp-line" d="M'+[P.base].concat(o).map(p=>px(p).toFixed(1)+' '+py(p).toFixed(1)).join('L')+'"/>';
    o.forEach((p,j)=>{const x=px(p),y=py(p);h+='<g class="mp-pin"><circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="12"/><text class="mp-n" x="'+x.toFixed(1)+'" y="'+(y+1).toFixed(1)+'">'+(j+1)+'</text><text class="mp-lbl" x="'+(x+16).toFixed(1)+'" y="'+(y+5).toFixed(1)+'">'+esc(title(p))+'</text></g>'});
    h+='</g>';
  });
  h+='<path class="mp-scale" d="M16 '+(H-18)+'v-6h'+g.toFixed(1)+'v6"/><text class="mp-st" x="16" y="'+(H-28)+'">'+nice+'km</text></svg>';
  return h;
}
function saveBlob(name,blob){
  const a=document.createElement('a'),u=URL.createObjectURL(blob);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
}
function rowsFor(P){
  const out=[['일차','순서','구분','장소','원어 이름','도착','시작','종료','머문시간(분)','이동(분)','이동수단','이동거리(km)','운영시간','예상비용(1인, 원)','비용 수준','구글 지도']];
  P.days.forEach((d,i)=>{let j=0;d.sim.rows.forEach(r=>{
    if(r.type==='lunch')out.push([i+1,'','식사','점심 식사','','',fm(r.start),fm(r.end),60,'','','','',P.hasCost?LUNCH[P.f.budget]:'','','']);
    else{j++;out.push([i+1,j,'방문',title(r.p),r.p.name,fm(r.arrive),fm(r.start),fm(r.end),r.stay,r.leg.min,r.leg.mode,+r.leg.km.toFixed(1),hrs(r.p),r.p.won!=null?r.p.won:'',LV[r.p.lv],gmap(r.p)])}
  })});
  return out;
}
function exportXlsx(){
  if(typeof XLSX==='undefined'){flash('엑셀 라이브러리를 불러오지 못했어요.');return}
  const P=plan,wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet(rowsFor(P));
  ws['!cols']=[6,6,6,22,22,8,8,8,12,10,10,12,14,16,10,40].map(w=>({wch:w}));
  XLSX.utils.book_append_sheet(wb,ws,'여행 동선');
  const sm=[['하우어바웃 여행 동선'],['여행지',P.ds.label],['기간',P.f.days+'일'],['MBTI',P.f.mbti],['동행',COMP_KO[P.f.comp]+' '+P.f.pax+'명'],['예산',BUD_KO[P.f.budget]],['조건',cond||'-'],['총 이동시간(분)',P.travel],['임의 순서 대비 절약(분)',P.saved],['평균 피로도',P.fat]];
  if(P.hasCost){sm.push(['1인 예상 비용(원)',P.cost]);sm.push(['인원 합계 예상(원)',P.cost*P.f.pax])}
  const ws2=XLSX.utils.aoa_to_sheet(sm);ws2['!cols']=[{wch:24},{wch:24}];XLSX.utils.book_append_sheet(wb,ws2,'요약');
  const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  saveBlob('하우어바웃_'+P.ds.label+'_'+P.f.days+'일.xlsx',new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  flash('엑셀 파일을 만들었어요.');
}
function wrapText(x,t,X,Y,maxW,lh){
  let line='',y=Y;for(const ch of String(t)){const test=line+ch;if(x.measureText(test).width>maxW&&line){x.fillText(line,X,y);line=ch;y+=lh}else line=test}
  if(line){x.fillText(line,X,y);y+=lh}return y;
}
function toBytes(c){return new Promise(r=>c.toBlob(b=>b.arrayBuffer().then(a=>r({bytes:new Uint8Array(a),w:c.width,h:c.height})),'image/jpeg',.9))}
function buildPDF(jp){
  const enc=new TextEncoder(),chunks=[],offs=[];let len=0;
  const push=x=>{const b=typeof x==='string'?enc.encode(x):x;chunks.push(b);len+=b.length};
  const obj=(id,fn)=>{offs[id]=len;push(id+' 0 obj\n');fn();push('\nendobj\n')};
  push('%PDF-1.4\n');const n=jp.length;
  obj(1,()=>push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2,()=>push('<< /Type /Pages /Kids ['+jp.map((_,i)=>(3+3*i)+' 0 R').join(' ')+'] /Count '+n+' >>'));
  jp.forEach((j,i)=>{
    const pid=3+3*i,cid=4+3*i,iid=5+3*i,ct='q 595 0 0 842 0 0 cm /Im'+i+' Do Q';
    obj(pid,()=>push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im'+i+' '+iid+' 0 R >> >> /Contents '+cid+' 0 R >>'));
    obj(cid,()=>push('<< /Length '+ct.length+' >>\nstream\n'+ct+'\nendstream'));
    obj(iid,()=>{push('<< /Type /XObject /Subtype /Image /Width '+j.w+' /Height '+j.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+j.bytes.length+' >>\nstream\n');push(j.bytes);push('\nendstream')});
  });
  const total=3*n+3,xr=len;push('xref\n0 '+total+'\n0000000000 65535 f \n');
  for(let id=1;id<total;id++)push(String(offs[id]).padStart(10,'0')+' 00000 n \n');
  push('trailer\n<< /Size '+total+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF');
  return new Blob(chunks,{type:'application/pdf'});
}
async function exportPdf(){
  flash('PDF를 만드는 중이에요...');
  const P=plan,W=1240,H=1754,FB_='"IBM Plex Sans KR","Apple SD Gothic Neo","Noto Sans KR",sans-serif',FD='"Do Hyeon","Apple SD Gothic Neo",sans-serif',DC=['#1D7F8C','#BF7D14','#8446D0'];
  try{await document.fonts.load('700 20px "IBM Plex Sans KR"','가');await document.fonts.load('400 20px "Do Hyeon"','가')}catch(e){}
  const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);x.textBaseline='alphabetic';return[c,x]};
  const foot=x=>{x.fillStyle='#566878';x.font='400 20px '+FB_;x.fillText('하우어바웃 · 운영시간과 비용은 추정값입니다. 방문 전 공식 정보를 확인하세요.',60,H-50)};
  const pages=[];let [c,x]=mk();
  x.fillStyle='#0F1B26';x.font='400 72px '+FD;x.fillText('하우어바웃',60,120);
  x.fillStyle='#566878';x.font='400 26px '+FB_;
  x.fillText(P.ds.label+' · '+P.f.days+'일 · '+P.f.mbti+' · '+COMP_KO[P.f.comp]+' '+P.f.pax+'명 · '+BUD_KO[P.f.budget]+' 예산',60,170);
  x.fillStyle='#0F1B26';x.font='700 28px '+FB_;
  x.fillText('총 이동 '+P.travel+'분   |   임의 순서보다 '+P.saved+'분 절약   |   평균 피로도 '+P.fat+' '+fatLabel(P.fat),60,236);
  if(P.hasCost)x.fillText('1인 예상 '+wonF(P.cost)+'   |   '+P.f.pax+'명 합계 '+wonF(P.cost*P.f.pax),60,280);
  const url=URL.createObjectURL(new Blob([exportSVG(P)],{type:'image/svg+xml'}));
  try{const img=await new Promise((ok,no)=>{const im=new Image();im.onload=()=>ok(im);im.onerror=no;im.src=url});x.drawImage(img,60,320,1120,700)}catch(e){}
  URL.revokeObjectURL(url);
  let y=1080;
  P.days.forEach((d,i)=>{
    x.fillStyle=DC[i%3];x.font='400 40px '+FD;x.fillText('DAY '+(i+1),60,y);
    x.fillStyle='#0F1B26';x.font='400 24px '+FB_;
    y=wrapText(x,d.order.map(title).join(' → '),200,y,980,34)+22;
  });
  foot(x);pages.push(await toBytes(c));
  for(let i=0;i<P.days.length;i++){
    const d=P.days[i];[c,x]=mk();
    x.fillStyle=DC[i%3];x.font='400 64px '+FD;x.fillText('DAY '+(i+1),60,110);
    x.fillStyle='#566878';x.font='400 24px '+FB_;
    x.fillText('이동 '+d.sim.travel+'분 · 피로도 '+d.fatigue+' '+fatLabel(d.fatigue)+(d.cost!=null?' · 1인 약 '+wonF(d.cost):''),60,156);
    let yy=220,j=0;
    d.sim.rows.forEach(r=>{
      if(yy>H-150)return;
      if(r.type==='lunch'){x.fillStyle='#566878';x.font='500 26px '+FB_;x.fillText(fm(r.start)+'–'+fm(r.end),60,yy);x.fillText('점심 식사',300,yy);yy+=64;return}
      j++;
      x.fillStyle='#566878';x.font='400 22px '+FB_;x.fillText(r.leg.mode+' '+r.leg.min+'분 · '+r.leg.km.toFixed(1)+'km',300,yy-6);yy+=34;
      x.fillStyle=DC[i%3];x.beginPath();x.arc(80,yy-10,20,0,7);x.fill();
      x.fillStyle='#fff';x.font='400 24px '+FD;x.textAlign='center';x.fillText(String(j),80,yy-1);x.textAlign='left';
      x.fillStyle='#0F1B26';x.font='700 28px '+FB_;x.fillText(fm(r.start)+'–'+fm(r.end),130,yy);
      x.font='700 34px '+FB_;x.fillText(title(r.p),420,yy);yy+=38;
      x.fillStyle='#566878';x.font='400 24px '+FB_;
      yy=wrapText(x,(r.p.desc||'')+' · '+r.p.tags.map(t=>TAG_KO[t]).join('/')+' · 운영 '+hrs(r.p)+' · '+(r.p.won!=null?'1인 약 '+wonF(r.p.won):'비용 '+LV[r.p.lv]),420,yy,760,32)+14;
    });
    foot(x);pages.push(await toBytes(c));
  }
  saveBlob('하우어바웃_'+P.ds.label+'_'+P.f.days+'일.pdf',buildPDF(pages));
  flash('PDF를 만들었어요.');
}
let ft=null;
function flash(t){let e=$('#toast');if(!e){e=document.createElement('div');e.id='toast';e.setAttribute('role','status');document.body.appendChild(e)}e.textContent=t;e.hidden=false;clearTimeout(ft);ft=setTimeout(()=>e.hidden=true,2600)}

/* ===== 이벤트 ===== */
buildPanel();
$('#panel').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.q){$('#dest').value=b.dataset.q;run({scroll:true})}
  else if(b.dataset.alt!=null){const g=geoAlts[+b.dataset.alt];if(g){$('#dest').value=g.name.split(',')[0];run({geo:g,scroll:true})}}
  else if(b.id==='go')run({scroll:true});
  else if(b.dataset.k){const k=b.dataset.k;f[k]=(k==='days'||k==='start')?+b.dataset.v:b.dataset.v;if(k==='move')f.move=b.dataset.v;if(k==='radius'){syncPressed();save();return}replan()}
  else if(b.dataset.m){const i=+b.dataset.m,a=f.mbti.split('');a[i]=b.dataset.v;f.mbti=a.join('');replan()}
  else if(b.dataset.pax){f.pax=Math.max(1,Math.min(8,f.pax+ +b.dataset.pax));syncPressed();render();save()}
  else if(b.id==='goRes')$('#results').scrollIntoView({behavior:'smooth',block:'start'});
});
$('#panel').addEventListener('input',e=>{if(e.target.id==='sl'){f.slider=(+e.target.value)/10;replan()}});
$('#panel').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='dest'){e.preventDefault();run({scroll:true})}});
$('#reroll').onclick=()=>{seed=Math.floor(Math.random()*1e9)+1;replan()};
$('#results').addEventListener('click',e=>{
  const t=e.target.closest('[data-tab]');if(t){dayFilter=+t.dataset.tab;render();return}
  const rv=e.target.closest('[data-rv]');if(rv){openSheet(rv.dataset.rv);return}
  const st=e.target.closest('.stop');if(st&&!e.target.closest('a,button'))selectStop(+st.dataset.i,+st.dataset.j,false);
});
$('#shX').onclick=closeSheet;$('#scrim').onclick=closeSheet;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#sheetwrap').hidden)closeSheet()});
$('#dlx').onclick=()=>{if(plan)exportXlsx()};$('#dlp').onclick=()=>{if(plan)exportPdf().catch(()=>flash('PDF를 만들지 못했어요.'))};
syncPressed();renderTaste();
run({keepMove:true});
fbInit();
