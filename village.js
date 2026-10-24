// 숭실 캠퍼스 마을 (견본) — 숭실대 홈페이지 캠퍼스맵의 실제 위치·층수를 바탕으로, 건물을 기본 도형으로 그린다.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ───────── 1. 건물 내용 (위치는 숭실대 캠퍼스맵 좌표, 층수는 같은 페이지 안내 기준) ───────── */
// style: 건물 겉모습 종류 / feat: 둘러보기 정거장 / locked: 비밀번호 건물
const PLACES = [
  { id: 'gate', no: '', name: '정문', sub: '숭실 캠퍼스 입구', kind: 'gate', x: -2, z: 23, feat: true,
    desc: '숭실대학교 교육대학원 유아교육전공 현장역량강화 프로그램 마을에 오신 것을 환영해요. 실제 캠퍼스 배치대로 건물을 놓았어요.',
    items: ['아래로 내리면 차례로 둘러봐요', '건물을 누르면 그곳으로 다가가요', '숨은 별 5개도 찾아보세요'] },
  { id: 'baird', no: '01', name: '베어드홀', cam: { yaw: 0.95, pitch: 0.5 }, lat: 37.4965129, lng: 126.9563359, w: 14, d: 9, floors: 5, style: 'terrace', color: '#e6dcc8', feat: true,
    sub: '대학본부 · 지상 5층', desc: '1988년에 지은 과학관을 베어드 박사의 이름을 따 베어드홀이라 불러요. 유리거울 창이 특징이고 한국건축작가협회상을 받았어요.',
    items: ['대학본부', '자연과학대학 실험실', '교수 연구실'] },
  { id: 'sungdeok', no: '02', name: '숭덕경상관', lat: 37.4969188, lng: 126.9549899, w: 10, d: 8, floors: 6, style: 'glass', color: '#4c5864',
    sub: '경제통상대학 · 경영대학', desc: '경제통상대학과 경영대학 강의실이 있는 6층 건물이에요.', items: ['지하 2층 · 지상 6층'] },
  { id: 'munhwa', no: '03', name: '문화관', lat: 37.4967040, lng: 126.9541645, w: 9, d: 7, floors: 5, style: 'fins', color: '#e8e6e0',
    sub: '과학교육시설 · 교수연구실', desc: '세로 줄무늬가 있는 하얀 5층 건물이에요.', items: ['지상 5층'] },
  { id: 'ahn', no: '04', name: '안익태기념관', lat: 37.4957736, lng: 126.9550471, w: 8, d: 7, floors: 4, style: 'wood', color: '#a86b3c',
    sub: '강의실', desc: '나무 무늬 외벽과 유리 상자가 어우러진 건물이에요.', items: ['강의실'] },
  { id: 'hyungnam', no: '05', name: '형남공학관', lat: 37.4957669, lng: 126.9562685, w: 9, d: 7, floors: 15, style: 'tower', color: '#d3d6d8', feat: true,
    sub: '공과대학 · 지상 15층', desc: '캠퍼스에서 가장 높은 15층 건물이에요. 멀리서도 잘 보이는 숭실의 얼굴이에요.', items: ['공과대학 실험실', '강의실', '매점'] },
  { id: 'gyoyuk', no: '06', name: '교육관', lat: 37.4978178, lng: 126.9568327, w: 9, d: 6, floors: 3, style: 'band', color: '#f1efe9', glass: '#5fa39b',
    sub: '학군단 본부', desc: '초록빛 창이 줄지어 있는 3층 건물이에요.', items: ['제136학군단 본부'] },
  { id: 'baekma', no: '07', name: '백마관', lat: 37.4978248, lng: 126.9563442, w: 9, d: 6, floors: 3, style: 'brick', color: '#a8483a', trim: '#f4f1ea',
    sub: '강의실 · 교수연구실', desc: '흰 테두리가 있는 붉은 벽돌 건물이에요.', items: ['강의실', '교수연구실', '축구부 숙소'] },
  { id: 'hankj', no: '08', name: '한경직기념관', lat: 37.4956196, lng: 126.9576165, w: 12, d: 8, floors: 2, style: 'chapel', color: '#3e4a66', feat: true,
    sub: '예배실 · 전시실', desc: '예배실과 전시실이 있는 2층 기념관이에요. 앞마당에 동상이 서 있어요.', items: ['예배실', '전시실'] },
  { id: 'sinyang', no: '09', name: '신양관', lat: 37.4963632, lng: 126.9582753, dx: -2, w: 7, d: 6, floors: 4, style: 'modern', color: '#efeee9',
    sub: '입학처 · 학사팀 · 편의시설', desc: '입학처, 학사팀, 교직원 식당, 서점, 은행, 우체국이 모여 있어요.', items: ['입학처 · 학사팀', '구내 서점 · 은행 · 우체국'] },
  { id: 'venture', no: '10', name: '벤처중소기업센터', lat: 37.4976198, lng: 126.9574751, w: 10, d: 8, floors: 7, style: 'curve', color: '#eeeeea',
    sub: '중소기업학과 · 창업기업실', desc: '한쪽 끝이 둥근 하얀 7층 건물이에요.', items: ['지하 1층 · 지상 7층'] },
  { id: 'jinri', no: '11', name: '진리관', lat: 37.4969098, lng: 126.9574665, w: 8.5, d: 7, floors: 5, style: 'brick', color: '#4b4b50',
    sub: '인문·사회계열 강의실', desc: '짙은 회색 벽돌의 5층 강의동이에요.', items: ['인문·사회계열 강의실', '매점'] },
  { id: 'cho', no: '12', name: '조만식기념관', lat: 37.4971606, lng: 126.9583484, w: 9, d: 7, floors: 5, style: 'grid', color: '#9c9c98',
    sub: '인문·사회계열 강의실', desc: '회색 돌로 지은 강의동이에요.', items: ['강의실', '교수연구실'] },
  { id: 'museum', no: '13', name: '한국기독교박물관', lat: 37.4956879, lng: 126.9569922, w: 8, d: 7, floors: 3, style: 'grid', color: '#ecebe6',
    sub: '전시실', desc: '하얀 돌로 지은 3층 박물관이에요.', items: ['전시실', '학예과 연구실'] },
  { id: 'library', no: '14', name: '중앙도서관', cam: { yaw: 0.9, pitch: 0.62 }, lat: 37.4962615, lng: 126.9586203, dx: 1, w: 10, d: 10, floors: 6, style: 'band', color: '#d9ccb4', glass: '#5d7f99', feat: true,
    sub: '자료실 · 강의안 · 녹화본', desc: '강의가 끝나면 강의안과 녹화본을 여기에 올려 둘게요. 실제로는 서고·열람실과 카페 숭실마루가 있는 6층 도서관이에요.',
    items: ['강의안 (준비 중)', '녹화본 (준비 중)'] },
  { id: 'research', no: '15', name: '연구관', cam: { yaw: 0.35, pitch: 0.62, dist: 28 }, lat: 37.4962617, lng: 126.9591993, w: 8, d: 5, floors: 3, style: 'brick', color: '#b8645a', feat: true, locked: true,
    sub: '교수용 · 비밀번호', desc: '교수 연구실이 있는 건물이에요. 공지 올리기, 출석·과제 확인을 하는 곳으로 꾸몄어요.', items: ['공지 올리기', '출석 확인', '과제 모아 보기'] },
  { id: 'changsin', no: '16', name: '창신관', lat: 37.4958952, lng: 126.9599447, w: 8, d: 5, floors: 3, style: 'brick', color: '#c27c6e',
    sub: '학생창업 동아리실', desc: '분홍빛 벽돌의 3층 건물이에요.', items: ['창업 동아리실', '창업보육실'] },
  { id: 'gbh', no: '17', name: 'Global Brain Hall', lat: 37.4957035, lng: 126.9605023, w: 8, d: 7, floors: 8, style: 'brick', color: '#c98b52',
    sub: '고시연구실 · 교수연구실', desc: '황토빛 벽돌의 8층 건물이에요.', items: ['지하 2층 · 지상 8층'] },
  { id: 'rh', no: '18', name: 'Residence Hall', lat: 37.4950584, lng: 126.9606067, w: 14, d: 6, floors: 12, style: 'facet', color: '#3b4660', feat: true,
    sub: '기숙사 · 지상 12층', desc: '톱니처럼 각진 지붕이 특징인 12층 기숙사예요.', items: ['기숙사', '매점', '식당'] },
  { id: 'jeonsan', no: '19', name: '전산관', lat: 37.4954698, lng: 126.9594700, w: 8, d: 7, floors: 5, style: 'grid', color: '#8f9190',
    sub: '강의실 · 실습실', desc: '회색 콘크리트의 5층 건물이에요.', items: ['강의실 및 실습실', '교직원 식당'] },
  { id: 'mirae', no: '20', name: '미래관', lat: 37.4956307, lng: 126.9583674, w: 9, d: 7, floors: 5, style: 'modern', color: '#f0efe9',
    sub: '강의실', desc: '하얀 외벽에 넓은 유리창이 있는 5층 강의동이에요.', items: ['강의실'] },
  { id: 'info', no: '21', name: '정보과학관', lat: 37.4946148, lng: 126.9596751, w: 11, d: 7, floors: 5, style: 'band', color: '#e3dccb', glass: '#4f9aa0',
    sub: 'IT대학', desc: 'IT대학 실습실과 강의실이 있어요.', items: ['실습실', '강의실'] },
  { id: 'westminster', no: '22', name: '웨스트민스터홀', cam: { yaw: -0.35, pitch: 0.78, dist: 34 }, lat: 37.4967804, lng: 126.9584436, w: 10, d: 7, floors: 5, style: 'glass', color: '#4f7fb5', feat: true,
    sub: '교육대학원 · 프로그램 안내', desc: '일반대학원과 특수대학원이 있는 파란 유리 건물이에요. 2026-2학기 현장역량강화 프로그램 「영유아 교육현장 속의 AI 교육 혁신」을 여기서 안내해요.',
    items: ['11월 7일 학회 추계학술대회 (7시간)', '11월 27일 비대면(Zoom) 사례발표', '11월 28일 대면 워크숍 (5시간)'],
    cta: { label: 'Zoom 입장하기 (견본)', href: '#' } },
  { id: 'student', no: '23', name: '학생회관', cam: { yaw: 0.2, pitch: 0.62, dist: 32 }, lat: 37.4970898, lng: 126.9570321, w: 8.5, d: 8, floors: 5, style: 'modern', color: '#d9d6cf', feat: true, locked: true,
    sub: '수강생용 · 비밀번호', desc: '학생식당과 동아리방이 있는 건물이에요. 과제 내기와 질문 남기기를 하는 곳으로 꾸몄어요.', items: ['과제 제출', '질문 남기기', '수료증 받기'] },
  { id: 'changui', no: '24', name: '창의관', lat: 37.4947011, lng: 126.9591821, w: 7, d: 6, floors: 8, style: 'glass', color: '#2f4f86',
    sub: 'AI전문대학원 · 융합연구원', desc: '짙은 파란 유리의 건물이에요. AI전문대학원이 있어요.', items: ['AI전문대학원', '스파르탄SW교육원'] },
  { id: 'field', no: '25', name: '대운동장', lat: 37.4973346, lng: 126.9560911, w: 24, d: 14, kind: 'field', feat: true,
    sub: '푸른 잔디 운동장', desc: '백마관과 교육관 앞의 넓은 운동장이에요.', items: [] },
];
const SAMPLE_PIN = '1234';
const SCALE = 4.5; // 한 칸 = 실제 4.5m
for (const p of PLACES) if (p.lat) {
  p.x = (p.lng - 126.9574) * 88350 / SCALE + (p.dx || 0);
  p.z = -(p.lat - 37.4962) * 110950 / SCALE + (p.dz || 0);
}

/* 아래로 내릴 때 들르는 순서(정거장) */
const STOPS = [
  { hero: true, t: [0, 0, 6], dist: 175, yaw: 0.5, pitch: 0.82 },
  ...['gate', 'hankj', 'hyungnam', 'baird', 'field', 'student', 'westminster', 'library', 'research', 'rh'].map(id => ({ place: id })),
  { end: true, t: [0, 0, 0], dist: 160, yaw: -0.55, pitch: 0.95 },
];

/* ───────── 2. 기본 준비 ───────── */
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;

const scene = new THREE.Scene();
const HORIZON = '#dfe7e6';
{ // 하늘: 위는 파랗고 지평선은 뿌옇게
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#8fbfe0'); gr.addColorStop(0.6, '#c9dfe9'); gr.addColorStop(1, HORIZON);
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t;
}
scene.fog = new THREE.Fog(HORIZON, 260, 620);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; // 유리에 비치는 빛
scene.environmentIntensity = 0.3;
const camera = new THREE.PerspectiveCamera(40, 1, 0.8, 1000);

scene.add(new THREE.HemisphereLight('#f4f1e6', '#7f8a72', 0.7));
const sun = new THREE.DirectionalLight('#fff0d8', 2.6);
sun.position.set(70, 105, 40);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 85, bottom: -85, near: 10, far: 320 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun);

const matCache = {};
const mat = (c, o = {}) => (matCache[c + JSON.stringify(o)] ??= new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o }));
const glassMat = c => mat(c, { roughness: 0.12, metalness: 0.6 });
function mesh(geo, color, x = 0, y = 0, z = 0, o) {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color, o) : color);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
const box = (w, h, d, c, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), c, x, y, z);

/* ───────── 3. 벽 무늬 그리기 (벽돌·콘크리트·유리·나무를 그림으로) ───────── */
let seed = 11;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const rr = (a, b) => a + rand() * (b - a);
function shade(hex, k) { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); }
function noiseTex(base, spread, size = 256, rep = 1) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size / 12; i++) { g.fillStyle = shade(base, rr(-spread, spread)); g.fillRect(rand() * size, rand() * size, rr(1, 3), rr(1, 3)); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8;
  return t;
}
const PPU = 18; // 한 칸에 몇 픽셀로 그릴지
const FH = 0.95; // 한 층 높이(한 칸 = 4.5m → 약 4.3m)
const texCache = new Map();
function glassGrad(g, x, y, w, h, tint) {
  const gr = g.createLinearGradient(x, y, x + w * 0.4, y + h);
  gr.addColorStop(0, shade(tint, 0.28)); gr.addColorStop(0.45, shade(tint, 0.05)); gr.addColorStop(1, shade(tint, -0.12));
  g.fillStyle = gr; g.fillRect(x, y, w, h);
}
// s: { mat, color, win: punched|band|curtain|none, glass, frame, floors, base(바닥 높이), door }
function facadeTex(wu, hu, s, front) {
  const key = [wu.toFixed(2), hu.toFixed(2), s.mat, s.color, s.win, s.glass, s.frame, s.floors, s.base, front && s.door !== false].join('|');
  if (texCache.has(key)) return texCache.get(key);
  const W = Math.min(1024, Math.max(16, Math.round(wu * PPU))), H = Math.min(1024, Math.max(16, Math.round(hu * PPU)));
  const ux = W / wu, uy = H / hu;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const glass = s.glass || '#5b7790';
  // 바탕
  if (s.mat === 'brick') {
    g.fillStyle = shade(s.color, 0.2); g.fillRect(0, 0, W, H);
    const bh = Math.max(2.5, uy * 0.16), bw = bh * 2.7;
    for (let y = 0, r = 0; y < H; y += bh, r++) for (let x = -(r % 2) * bw / 2; x < W; x += bw) {
      g.fillStyle = shade(s.color, rr(-0.06, 0.04)); g.fillRect(x + 0.6, y + 0.6, bw - 1.2, bh - 1.2);
    }
  } else if (s.mat === 'glass') {
    glassGrad(g, 0, 0, W, H, s.color);
    const mw = 1.25 * ux, fh = (hu - (s.base || 0)) / s.floors * uy;
    for (let x = 0; x < W; x += mw) for (let y = 0; y < H; y += fh) { g.fillStyle = `rgba(255,255,255,${rr(0, 0.12)})`; g.fillRect(x, y, mw, fh); }
    g.fillStyle = 'rgba(255,255,255,.10)'; // 비친 하늘 띠
    for (let i = 0; i < 3; i++) { const x0 = rr(0, W); g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + W * 0.15, 0); g.lineTo(x0 - W * 0.1, H); g.lineTo(x0 - W * 0.25, H); g.fill(); }
    g.strokeStyle = s.frame || '#c9d2da'; g.lineWidth = Math.max(1, ux * 0.07);
    for (let x = 0; x <= W; x += mw) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    g.lineWidth = Math.max(1.5, uy * 0.1);
    for (let y = H; y >= 0; y -= fh) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  } else if (s.mat === 'wood') {
    for (let x = 0; x < W; x += ux * 0.28) { g.fillStyle = shade(s.color, rr(-0.07, 0.05)); g.fillRect(x, 0, ux * 0.28, H); }
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < W; x += ux * 0.28) g.fillRect(x, 0, 1, H);
  } else { // concrete · stone · panel
    g.fillStyle = s.color; g.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 90; i++) { g.fillStyle = shade(s.color, rr(-0.035, 0.035)); g.fillRect(rand() * W, rand() * H, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,.10)'; g.lineWidth = 1;
    const jw = (s.mat === 'stone' ? 1.1 : 1.8) * ux, jh = (s.mat === 'stone' ? 0.55 : 0.95) * uy;
    for (let x = jw; x < W; x += jw) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = jh; y < H; y += jh) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    // 빗물 자국
    for (let i = 0; i < W / 20; i++) { const x = rr(0, W); const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(60,55,50,.10)'); gr.addColorStop(1, 'rgba(60,55,50,0)'); g.fillStyle = gr; g.fillRect(x, 0, rr(2, 6), H * rr(0.2, 0.6)); }
  }
  // 창
  const base = s.base || 0, floors = s.floors || 1, fh = (hu - base) / floors;
  const doorL = W / 2 - 1.1 * ux, doorR = W / 2 + 1.1 * ux, withDoor = front && s.door !== false;
  if (s.win === 'punched') {
    const n = Math.max(1, Math.floor(wu / 1.55));
    for (let f = 0; f < floors; f++) for (let c = 0; c < n; c++) {
      const cx = (c + 0.5) * W / n, ww = 0.78 * ux, wh = fh * 0.52 * uy;
      const x = cx - ww / 2, y = H - (base + f * fh + fh * 0.3) * uy - wh;
      if (withDoor && f === 0 && x + ww > doorL && x < doorR) continue;
      g.fillStyle = s.frame || '#e8e4da'; g.fillRect(x - ux * 0.07, y - uy * 0.07, ww + ux * 0.14, wh + uy * 0.16);
      glassGrad(g, x, y, ww, wh, glass);
      if (rand() < 0.3) { g.fillStyle = 'rgba(235,228,210,.75)'; g.fillRect(x, y, ww, wh * rr(0.2, 0.6)); } // 블라인드
      g.fillStyle = s.frame || '#e8e4da'; g.fillRect(cx - 0.6, y, 1.2, wh);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x - ux * 0.07, y + wh + uy * 0.09, ww + ux * 0.14, Math.max(1, uy * 0.05));
    }
  } else if (s.win === 'band') {
    for (let f = 0; f < floors; f++) {
      const wh = fh * 0.46 * uy, y = H - (base + f * fh + fh * 0.32) * uy - wh;
      const x0 = 0.25 * ux, x1 = W - 0.25 * ux;
      if (withDoor && f === 0) { glassGrad(g, x0, y, doorL - x0 - ux * 0.3, wh, glass); glassGrad(g, doorR + ux * 0.3, y, x1 - doorR - ux * 0.3, wh, glass); }
      else glassGrad(g, x0, y, x1 - x0, wh, glass);
      g.fillStyle = s.frame || '#d8dcdf';
      for (let x = x0; x <= x1; x += 1.2 * ux) g.fillRect(x - 0.7, y, 1.4, wh);
      g.fillRect(x0, y - 1, x1 - x0, 1.5);
    }
  }
  if (s.mat !== 'glass' && s.mat !== 'wood') { // 층 띠·바닥 턱
    g.fillStyle = 'rgba(0,0,0,.07)';
    for (let f = 1; f < floors; f++) g.fillRect(0, H - (base + f * fh) * uy - 1, W, 2);
  }
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(0, H - Math.max(2, uy * 0.25), W, Math.max(2, uy * 0.25));
  if (withDoor) { // 현관 유리문
    const dw = 1.8 * ux, dh = Math.min(fh * 0.85, 1.0) * uy;
    g.fillStyle = '#3a3a3a'; g.fillRect(W / 2 - dw / 2 - 2, H - (base) * uy - dh - 2, dw + 4, dh + 2);
    glassGrad(g, W / 2 - dw / 2, H - base * uy - dh, dw, dh, '#2f4458');
    g.fillStyle = '#3a3a3a'; g.fillRect(W / 2 - 1, H - base * uy - dh, 2, dh);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  texCache.set(key, t);
  return t;
}
const ROOF = mat('#ffffff', { map: noiseTex('#a9a8a3', 0.05, 128, 2), roughness: 0.95 });
const facadeMat = (t, s) => new THREE.MeshStandardMaterial({ map: t, roughness: s.mat === 'glass' ? 0.08 : s.mat === 'brick' ? 0.92 : 0.82, metalness: s.mat === 'glass' ? 0.55 : 0 });
function facadeBox(w, h, d, s, x = 0, y = 0, z = 0) {
  const fr = facadeMat(facadeTex(w, h, s, true), s), bk = facadeMat(facadeTex(w, h, s, false), s), sd = facadeMat(facadeTex(d, h, s, false), s);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sd, sd, ROOF, ROOF, fr, bk]);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function roofStuff(g, w, d, y, cx = 0, cz = 0) { // 옥상 실외기·계단실
  const n = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) g.add(box(rr(0.8, 2), rr(0.5, 1.1), rr(0.8, 1.6), shade('#b8b6b0', rr(-0.06, 0.04)), cx + rr(-w / 3, w / 3), y + 0.4, cz + rr(-d / 3, d / 3)));
  g.add(box(w + 0.15, 0.35, d + 0.15, '#cfccc4', cx, y + 0.17, cz));
}

/* ───────── 4. 땅 · 길 · 동네 ───────── */
const ISL = { a: 80, b: 56 }; // 작은 지도 크기 기준
const CAMPUS = { x0: -72, x1: 74, z0: -50, z1: 45, r: 10 }; // 캠퍼스 잔디 땅(둥근 네모)
const inCampus = (x, z, m = 0) => x > CAMPUS.x0 - m && x < CAMPUS.x1 + m && z > CAMPUS.z0 - m && z < CAMPUS.z1 + m;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), mat('#ffffff', { map: noiseTex('#a7a49b', 0.04, 256, 120), roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.12; ground.receiveShadow = true;
scene.add(ground);
const lawnShape = new THREE.Shape();
{ const { x0, x1, z0, z1, r } = CAMPUS; lawnShape.moveTo(x0 + r, z0); lawnShape.lineTo(x1 - r, z0); lawnShape.quadraticCurveTo(x1, z0, x1, z0 + r); lawnShape.lineTo(x1, z1 - r); lawnShape.quadraticCurveTo(x1, z1, x1 - r, z1); lawnShape.lineTo(x0 + r, z1); lawnShape.quadraticCurveTo(x0, z1, x0, z1 - r); lawnShape.lineTo(x0, z0 + r); lawnShape.quadraticCurveTo(x0, z0, x0 + r, z0); }
const lawnTex = noiseTex('#7f9c55', 0.07, 256, 1); lawnTex.repeat.set(0.03, 0.03);
const lawn = new THREE.Mesh(new THREE.ShapeGeometry(lawnShape), mat('#ffffff', { map: lawnTex, roughness: 1, side: THREE.DoubleSide }));
lawn.rotation.x = Math.PI / 2; lawn.position.y = 0.03; lawn.receiveShadow = true;
scene.add(lawn);

const PAVE = mat('#ffffff', { map: noiseTex('#d6cfc0', 0.05, 128, 6), roughness: 0.95 });
const ASPH = mat('#ffffff', { map: noiseTex('#55575a', 0.05, 128, 10), roughness: 0.9 });
function path(ax, az, bx, bz, w = 3, m = PAVE, y = 0.07) {
  const len = Math.hypot(bx - ax, bz - az);
  const p = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, len), m);
  p.position.set((ax + bx) / 2, y, (az + bz) / 2);
  p.rotation.y = Math.atan2(bx - ax, bz - az);
  p.receiveShadow = true;
  scene.add(p);
}
path(-62, 3, 66, 3, 4.5);            // 동서 큰길
path(-2, 30, -2, -33, 4);           // 정문에서 북쪽으로
path(8, 3, 8, -30, 3);               // 진리관·벤처 쪽
path(30, 3, 30, -26, 3);             // 웨스트민스터·조만식 쪽
path(40, 3, 56, 34, 3);              // 기숙사 쪽
path(-40, 3, -40, -20, 3);           // 숭덕경상관 쪽
const plaza = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 0.1, 40), mat('#ffffff', { map: noiseTex('#b56f55', 0.08, 128, 4) }));
plaza.position.set(-10, 0.09, 3); plaza.receiveShadow = true; scene.add(plaza); // 베어드홀 앞 붉은 벽돌 광장

// 상도로(캠퍼스 남쪽 큰 찻길) + 차선
const ROADZ = 50;
path(-2, 30, -2, ROADZ - 3, 4); // 정문에서 상도로까지
path(-260, ROADZ, 260, ROADZ, 7, ASPH, 0.03);
for (let x = -250; x < 250; x += 5) path(x, ROADZ, x + 2.4, ROADZ, 0.12, mat('#f2f0e8'), 0.08);
path(-260, ROADZ - 4.2, 260, ROADZ - 4.2, 1.4, PAVE, 0.05); path(-260, ROADZ + 4.2, 260, ROADZ + 4.2, 1.4, PAVE, 0.05);
for (const x of [-120, 90]) { path(x, ROADZ, x, -200, 5, ASPH, 0.03); path(x, ROADZ, x, 200, 5, ASPH, 0.03); }

// 캠퍼스 밖 동네(상도동 낮은 건물 + 동쪽 아파트)
const CITY = [
  { mat: 'concrete', color: '#d8d0c2', win: 'punched' }, { mat: 'brick', color: '#9c5a46', win: 'punched' },
  { mat: 'concrete', color: '#eceae4', win: 'band', glass: '#6d8799' }, { mat: 'stone', color: '#b9b4aa', win: 'punched' },
  { mat: 'brick', color: '#b88a6a', win: 'punched' }, { mat: 'concrete', color: '#c9cdd0', win: 'punched', glass: '#47627a' },
];
const cityBoxes = [];
// 동네 건물은 수백 채라, 창 한 칸짜리 그림을 만들어 두고 되풀이해 붙인다
const tileCache = new Map();
function cityBox(w, h, d, s, x, z) {
  const key = s.mat + s.color + s.win + s.glass;
  if (!tileCache.has(key)) tileCache.set(key, facadeTex(1.55, FH, { ...s, floors: 1, base: 0, door: false }, false));
  const tile = tileCache.get(key);
  const face = n => { const t = tile.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(n / 1.55)), Math.round(h / FH)); t.needsUpdate = true; return facadeMat(t, s); };
  const fw = face(w), fd = face(d);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [fd, fd, ROOF, ROOF, fw, fw]);
  m.position.set(x, h / 2, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cityOk(x, z, r) {
  if (inCampus(x, z, 3 + r)) return false;
  if (Math.abs(z - ROADZ) < 7 + r || Math.abs(x + 120) < 5 + r || Math.abs(x - 90) < 5 + r) return false;
  return !cityBoxes.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br + r + 1.5);
}
const cityGroup = new THREE.Group();
for (let i = 0; i < 3000 && cityBoxes.length < 230; i++) {
  const x = rr(-210, 210), z = rr(-170, 150);
  const apt = x > 70 && x < 150 && z < 20 && z > -90 && rand() < 0.5; // 동쪽 아파트 단지
  const w = apt ? rr(11, 15) : rr(4, 9), d = apt ? rr(3.5, 4.5) : rr(4, 8), r = Math.hypot(w, d) / 2;
  if (!cityOk(x, z, r)) continue;
  const fl = apt ? 13 + Math.floor(rand() * 8) : 2 + Math.floor(rand() * 5);
  const s = apt ? { mat: 'concrete', color: '#eeece6', win: 'punched', floors: fl, frame: '#dcd9d0', door: false } : { ...CITY[Math.floor(rand() * CITY.length)], floors: fl, door: rand() < 0.5 };
  const b = cityBox(w, fl * FH, d, s, x, z);
  b.rotation.y = apt ? 0.08 : (rand() < 0.5 ? 0 : Math.PI / 2) + rr(-0.05, 0.05);
  cityGroup.add(b);
  if (!apt && rand() < 0.5) cityGroup.add(box(w + 0.1, 0.3, d + 0.1, '#8c8a85', x, fl * FH + 0.15, z));
  cityBoxes.push([x, z, r]);
}
scene.add(cityGroup);

/* ───────── 5. 캠퍼스 건물 만들기 ───────── */
const pickables = [];
const placeGroups = {};
const MATS = { brick: 'brick', grid: 'stone', glass: 'glass', band: 'concrete', modern: 'concrete', fins: 'concrete', wood: 'wood', chapel: 'panel', facet: 'panel', terrace: 'concrete', tower: 'concrete', curve: 'concrete' };
function building(p) {
  const g = new THREE.Group();
  const { w, d, floors, color } = p;
  const H = floors * FH + 0.3;
  const S = (o = {}) => ({ mat: MATS[p.style] || 'stone', color, floors, base: 0.3, glass: p.glass, frame: p.trim, win: 'punched', ...o });
  g.add(box(w + 0.8, 0.12, d + 0.8, '#d9d4c8', 0, 0.06, 0)); // 건물 둘레 보도
  switch (p.style) {
    case 'terrace': { // 베어드홀: 계단처럼 물러나는 층 + 거울 유리 띠 + 테라스 화분
      const steps = [[d, 2], [d * 0.72, 2], [d * 0.46, 1]];
      let y = 0;
      steps.forEach(([dd, fl], i) => {
        const zc = (d - dd) / -2, hh = fl * FH + (i ? 0 : 0.3);
        g.add(facadeBox(w, hh, dd, S({ floors: fl, base: i ? 0 : 0.3, win: 'band', glass: '#3e6282', door: i === 0 }), 0, y, zc));
        g.add(box(w + 0.15, 0.22, 0.12, '#f0ebe0', 0, y + hh + 0.11, zc + dd / 2)); // 난간
        if (i < 2) for (let k = 0; k < Math.floor(w / 1.4); k++) g.add(mesh(new THREE.SphereGeometry(0.3, 8, 6), '#5f8a45', -w / 2 + 0.7 + k * 1.4, y + hh + 0.3, zc + dd / 2 - (steps[i][0] - steps[i + 1][0]) / 2));
        y += hh;
      });
      roofStuff(g, w, d * 0.46, y, 0, (d - d * 0.46) / -2);
      return { g, H: y + 0.5 };
    }
    case 'tower': { // 형남공학관: 낮은 받침 + 15층 탑 + 앞면 세로 유리
      const pf = 3;
      g.add(facadeBox(w + 5, pf * FH + 0.3, d + 3, S({ floors: pf, win: 'band', color: '#c3c6c8', glass: '#536f88' })));
      g.add(facadeBox(w, floors * FH, d, S({ floors, base: 0, door: false, glass: '#3f5a72', frame: '#e6e8e9' }), 0, pf * FH + 0.3, -0.5));
      g.add(facadeBox(2.6, floors * FH - 0.6, 0.35, { mat: 'glass', color: '#6f8fae', floors, win: 'none' }, 0, pf * FH + 0.3, d / 2 - 0.35));
      roofStuff(g, w, d, (pf + floors) * FH + 0.3, 0, -0.5);
      return { g, H: (pf + floors) * FH + 1.5 };
    }
    case 'glass': { // 통유리 건물
      g.add(facadeBox(w, H, d, S({ win: 'none', door: false, frame: '#d3dbe2' })));
      g.add(box(2.6, 1.0, 0.25, '#2a3644', 0, 0.8, d / 2 + 0.05)); // 출입구
      g.add(box(3.4, 0.18, 1.4, '#e3e6e8', 0, 1.4, d / 2 + 0.6));
      roofStuff(g, w, d, H);
      return { g, H: H + 0.8 };
    }
    case 'band': case 'modern': {
      g.add(facadeBox(w, H, d, S({ win: 'band' })));
      if (p.style === 'modern') g.add(facadeBox(w * 0.3, H - 0.3, 0.35, { mat: 'glass', color: '#7b9ab3', floors, win: 'none' }, w * 0.25, 0.3, d / 2 + 0.05));
      g.add(box(3.2, 0.16, 1.3, '#efe9dd', 0, 1.35, d / 2 + 0.6));
      roofStuff(g, w, d, H);
      return { g, H: H + 0.8 };
    }
    case 'fins': { // 문화관: 세로 줄무늬
      g.add(facadeBox(w, H, d, S({ win: 'band', glass: '#647d90' })));
      for (let i = 0; i <= Math.floor(w / 1.1); i++) for (const zz of [d / 2 + 0.18, -d / 2 - 0.18]) g.add(box(0.18, H - 0.3, 0.36, '#f7f6f2', -w / 2 + i * (w / Math.floor(w / 1.1)), 0.3 + (H - 0.3) / 2, zz));
      roofStuff(g, w, d, H);
      return { g, H: H + 0.8 };
    }
    case 'wood': { // 안익태기념관: 나무 외벽 + 유리 상자
      g.add(facadeBox(w, H, d, S({ win: 'none' })));
      g.add(facadeBox(w * 0.55, H * 0.72, d * 0.9, { mat: 'glass', color: '#7aa0bd', floors: Math.max(1, floors - 1), win: 'none' }, w * 0.45, H * 0.28, 0));
      roofStuff(g, w, d, H);
      return { g, H: H + 0.8 };
    }
    case 'curve': { // 벤처중소기업센터: 한쪽 끝이 둥근 건물
      const s = S({ win: 'band', glass: '#5b7f9e' });
      g.add(facadeBox(w - d / 2, H, d, s, -d / 4, 0, 0));
      const side = facadeMat(facadeTex(Math.PI * d / 2, H, { ...s, door: false }, false), s);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(d / 2, d / 2, H, 32, 1, false, 0, Math.PI), [side, ROOF, ROOF]);
      cyl.position.set(w / 2 - d / 2, H / 2, 0); cyl.castShadow = cyl.receiveShadow = true;
      g.add(cyl);
      roofStuff(g, w - d / 2, d, H, -d / 4, 0);
      return { g, H: H + 0.8 };
    }
    case 'chapel': { // 한경직기념관: 짙은 남색 + 붉은 띠 + 앞 기둥 + 동상
      const hh = floors * FH + 1.2;
      g.add(facadeBox(w, hh, d, S({ win: 'punched', glass: '#2c3d52', frame: '#cfd3da', base: 0.6 })));
      for (const [bw, bd, bx, bz] of [[w + 0.2, 0.3, 0, d / 2], [w + 0.2, 0.3, 0, -d / 2], [0.3, d, w / 2, 0], [0.3, d, -w / 2, 0]]) g.add(box(bw, 0.45, bd, '#a8362f', bx, hh, bz)); // 붉은 띠
      for (let i = 0; i < 6; i++) g.add(mesh(new THREE.CylinderGeometry(0.24, 0.26, hh, 14), '#f1ede4', -3.5 + i * 1.4, hh / 2, d / 2 + 1.4));
      g.add(box(8.6, 0.35, 2.2, '#f1ede4', 0, hh + 0.1, d / 2 + 1.2));
      const bronze = { metalness: 0.7, roughness: 0.35 };
      g.add(box(1.2, 0.9, 1.2, '#cfc8bb', -w / 2 - 1.5, 0.45, d / 2 + 3.5)); // 동상 받침
      g.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.9, 10), '#7a5a30', -w / 2 - 1.5, 1.35, d / 2 + 3.5, bronze));
      g.add(mesh(new THREE.SphereGeometry(0.2, 12, 10), '#7a5a30', -w / 2 - 1.5, 1.95, d / 2 + 3.5, bronze));
      return { g, H: hh + 0.6 };
    }
    case 'facet': { // Residence Hall: 톱니 지붕의 각진 기숙사
      g.add(facadeBox(w, H, d, S({ win: 'punched', glass: '#2f4157', frame: '#56627a' })));
      const n = 5, sw = w / n, roofM = mat('#46536f', { roughness: 0.5, metalness: 0.3 });
      for (let i = 0; i < n; i++) {
        const sh = new THREE.Shape(), rh = 2 + (i % 2) * 1.6;
        sh.moveTo(-sw / 2, 0); sh.lineTo(sw / 2, 0); sh.lineTo(sw / 2 - (i % 2 ? 0 : sw), rh); sh.closePath();
        const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -d / 2);
        g.add(mesh(geo, roofM, -w / 2 + sw / 2 + i * sw, H, 0));
      }
      return { g, H: H + 3.6 };
    }
    case 'brick': default: { // 벽돌·돌 건물
      g.add(facadeBox(w, H, d, S({ frame: p.trim || (p.style === 'brick' ? '#efe9de' : '#d8d6d0') })));
      if (p.trim) for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.4, H, 0.4, p.trim, sx * w / 2, H / 2, sz * d / 2));
      g.add(box(3, 0.16, 1.3, '#efe9dd', 0, 1.35, d / 2 + 0.6));
      roofStuff(g, w, d, H);
      return { g, H: H + 0.8 };
    }
  }
}

function gate() {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    g.add(facadeBox(1.4, 5, 1.4, { mat: 'stone', color: '#d8d4cb', win: 'none', floors: 1, door: false }, sx * 5.5, 0, 0));
    g.add(box(1.8, 0.4, 1.8, '#bdb8ae', sx * 5.5, 5.2, 0));
  }
  g.add(box(12.6, 1.0, 0.9, '#1f6fae', 0, 4.6, 0));
  return { g, H: 5.5 };
}
function field(p) {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) { const s = box(p.w / 8, 0.1, p.d, i % 2 ? '#5d9a49' : '#53903f', -p.w / 2 + (i + 0.5) * p.w / 8, 0.06, 0); s.castShadow = false; g.add(s); }
  const line = (w, d, x, z) => { const l = box(w, 0.12, d, '#f4f4f0', x, 0.07, z); l.castShadow = false; g.add(l); };
  line(p.w - 1, 0.1, 0, -p.d / 2 + 0.5); line(p.w - 1, 0.1, 0, p.d / 2 - 0.5);
  line(0.1, p.d - 1, -p.w / 2 + 0.5, 0); line(0.1, p.d - 1, p.w / 2 - 0.5, 0); line(0.1, p.d - 1, 0, 0);
  const c = mesh(new THREE.TorusGeometry(1.8, 0.05, 6, 40), '#f4f4f0', 0, 0.12, 0); c.rotation.x = Math.PI / 2; c.castShadow = false; g.add(c);
  for (const sx of [-1, 1]) { // 골대
    for (const sz of [-1, 1]) g.add(box(0.08, 0.55, 0.08, '#ffffff', sx * (p.w / 2 - 0.5), 0.33, sz * 0.8));
    g.add(box(0.08, 0.08, 1.7, '#ffffff', sx * (p.w / 2 - 0.5), 0.6, 0));
  }
  for (const sz of [-1, 1]) g.add(box(p.w + 2, 1.2, 0.05, '#4a6b4a', 0, 0.6, sz * (p.d / 2 + 0.8))); // 펜스
  return { g, H: 1 };
}

const blockers = [];
for (const p of PLACES) {
  const { g, H } = p.kind === 'gate' ? gate() : p.kind === 'field' ? field(p) : building(p);
  g.position.set(p.x, 0, p.z);
  p.H = H;
  p.top = H + 1.6;
  if (p.w) blockers.push([p.x, p.z, p.w / 2 + 1.6, p.d / 2 + 1.6]);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: null, depthTest: false, transparent: true, sizeAttenuation: false }));
  label.position.set(0, p.top, 0);
  label.renderOrder = 10;
  g.add(label);
  p.label = label;
  g.traverse(o => { if (o.isMesh || o.isSprite) { o.userData.placeId = p.id; pickables.push(o); } });
  scene.add(g);
  placeGroups[p.id] = g;
}
document.fonts.load('800 56px "Pretendard Variable"').finally(() => {
  for (const p of PLACES) { p.label.material.map = labelTexture(p); p.label.material.needsUpdate = true; }
});

function labelTexture(p) {
  const cv = document.createElement('canvas');
  cv.width = 700; cv.height = 150;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(255,253,248,.96)';
  g.strokeStyle = '#2a2620'; g.lineWidth = 6;
  g.beginPath(); g.roundRect(6, 6, 688, 138, 70); g.fill(); g.stroke();
  let x = 50;
  if (p.no) {
    g.fillStyle = p.locked ? '#2a2620' : p.feat ? '#0a7cc1' : '#8a8478';
    g.beginPath(); g.arc(75, 75, 48, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.font = '800 42px "Pretendard Variable", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(p.no, 75, 78);
    x = 140;
  }
  g.fillStyle = '#2a2620'; g.font = '800 56px "Pretendard Variable", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText((p.locked ? '🔒 ' : '') + p.name, x, 80, 690 - x - 30);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ───────── 6. 나무 · 가로등 · 구름 · 사람 · 차 · 숨은 별 (실제 크기 비율) ───────── */
const occluders = []; // 카메라 앞을 가릴 수 있는 것(나무 등)
const lamps = [];
const LEAF = ['#b8703a', '#a54e36', '#c99a45', '#6a8a45', '#57773f', '#8c9a4e', '#c0843f'];
const onRoad = (x, z) => (Math.abs(z - 3) < 3.2 && x > -63 && x < 67) || (Math.abs(x + 2) < 2.8 && z > -34 && z < 31) ||
  (Math.abs(x - 8) < 2.2 && z < 3 && z > -31) || (Math.abs(x - 30) < 2.2 && z < 3 && z > -27) || (Math.abs(x + 40) < 2.2 && z < 3 && z > -21) || Math.hypot(x + 10, z - 3) < 7.5;
const blocked = (x, z) => onRoad(x, z) || blockers.some(([bx, bz, hw, hd]) => Math.abs(x - bx) < hw && Math.abs(z - bz) < hd);
// 나무는 수백 그루라 한꺼번에 그린다
const trees = [];
for (let i = 0; i < 4000 && trees.length < 420; i++) {
  const x = rr(CAMPUS.x0 + 1, CAMPUS.x1 - 1), z = rr(CAMPUS.z0 + 1, CAMPUS.z1 - 1);
  if (!blocked(x, z)) trees.push([x, z, rr(0.55, 0.95)]);
}
for (let x = -250; x < 250; x += 6) for (const zz of [ROADZ - 5.3, ROADZ + 5.3]) if (Math.abs(x + 2) > 7 && rand() < 0.8) trees.push([x + rr(-0.5, 0.5), zz, rr(0.6, 0.8)]); // 가로수
for (let i = 0; i < 2500 && trees.length < 700; i++) { const x = rr(-200, 200), z = rr(-160, 140); if (cityOk(x, z, 1.5)) trees.push([x, z, rr(0.5, 0.9)]); }
let trunkIM, crownIM;
{
  const trunk = trunkIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.12, 0.17, 1, 6), mat('#6b4b32'), trees.length);
  const crown = crownIM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat('#ffffff', { roughness: 0.95 }), trees.length * 3);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  trees.forEach(([x, z, s], i) => {
    m.compose(new THREE.Vector3(x, 0.75 * s, z), q, new THREE.Vector3(s, 1.5 * s, s)); trunk.setMatrixAt(i, m);
    const c = LEAF[Math.floor(rand() * LEAF.length)];
    for (let k = 0; k < 3; k++) {
      const r = (k === 0 ? 1.15 : rr(0.65, 0.9)) * s;
      m.compose(new THREE.Vector3(x + (k ? rr(-0.6, 0.6) * s : 0), (k === 0 ? 2.1 : rr(2.4, 2.9)) * s, z + (k ? rr(-0.6, 0.6) * s : 0)), q, new THREE.Vector3(r, r * 0.9, r));
      crown.setMatrixAt(i * 3 + k, m);
      crown.setColorAt(i * 3 + k, col.set(shade(c, rr(-0.05, 0.05))));
    }
  });
  for (const im of [trunk, crown]) { im.castShadow = im.receiveShadow = true; scene.add(im); }
  occluders.push(crown, ...cityGroup.children);
}
for (const z of [8, 13, 18, 23]) for (const sx of [-1, 1]) { // 정문 길 가로등
  const lamp = new THREE.Group();
  lamp.add(box(0.1, 1.8, 0.1, '#3d3a36', -2 + sx * 2.4, 0.9, z));
  lamp.add(mesh(new THREE.SphereGeometry(0.2, 10, 8), '#fff3c4', -2 + sx * 2.4, 1.85, z, { emissive: '#ffd77a', emissiveIntensity: 0.5 }));
  lamp.userData.xz = [-2 + sx * 2.4, z];
  scene.add(lamp); lamps.push(lamp);
}
for (const [x, z] of [[-14, 0.5], [-6, 0.5], [-14, 5.5], [-6, 5.5]]) scene.add(box(1.0, 0.12, 0.35, '#8b6142', x, 0.25, z)); // 광장 벤치

const clouds = [];
for (let i = 0; i < 12; i++) {
  const g = new THREE.Group();
  const cm = mat('#ffffff', { roughness: 1, transparent: true, opacity: 0.92 });
  for (let k = 0; k < 5; k++) g.add(mesh(new THREE.SphereGeometry(3 + rand() * 2.5, 12, 8), cm, k * 3.4 - 6, rand() * 1.5, rand() * 2.5));
  g.position.set(-160 + rand() * 320, 60 + rand() * 16, -160 + rand() * 120);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  g.userData.v = 0.7 + rand() * 0.9;
  scene.add(g); clouds.push(g);
}

const SHIRTS = ['#2f6fa8', '#c8743a', '#4f7a44', '#b56a8a', '#d9b34a', '#6c5f9c', '#e9e6df', '#333a44'];
const people = [];
for (let i = 0; i < 46; i++) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.32, 8), SHIRTS[i % SHIRTS.length], 0, 0.3, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 6), '#2e3240', 0, 0.08, 0));
  g.add(mesh(new THREE.SphereGeometry(0.1, 10, 8), '#f0caa6', 0, 0.55, 0));
  g.add(mesh(new THREE.SphereGeometry(0.105, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#2b2019', 0, 0.58, 0));
  // 0: 동서 큰길, 1: 정문 길
  g.userData = { lane: i % 3 === 0 ? 1 : 0, u: rand(), v: (0.004 + rand() * 0.004) * (rand() < 0.5 ? 1 : -1), off: (rand() - 0.5) * 3 };
  scene.add(g); people.push(g);
}
const CARC = ['#f2f2f0', '#1e1f22', '#9da3a8', '#7d1f22', '#2d4d7a', '#e9e6df'];
const cars = [];
for (let i = 0; i < 18; i++) {
  const g = new THREE.Group(), c = CARC[i % CARC.length];
  g.add(mesh(new THREE.BoxGeometry(1.0, 0.28, 0.44), c, 0, 0.2, 0, { metalness: 0.5, roughness: 0.35 }));
  g.add(mesh(new THREE.BoxGeometry(0.55, 0.22, 0.4), glassMat('#2a3a4a'), -0.05, 0.42, 0));
  if (i % 7 === 3) { g.scale.set(2.4, 1.6, 1.15); } // 버스
  const dir = i % 2 ? 1 : -1;
  g.userData = { x: rr(-250, 250), dir, v: rr(5, 8), z: ROADZ + (dir > 0 ? 1.7 : -1.7) };
  g.rotation.y = dir > 0 ? 0 : Math.PI;
  scene.add(g); cars.push(g);
}

const STAR_SPOTS = [[-58, -3], [30, 42], [70, 16], [-34, -38], [12, 22]];
const stars = STAR_SPOTS.map(([x, z], i) => {
  const s = mesh(new THREE.OctahedronGeometry(0.8, 0), '#ffcf3a', x, 1.4, z, { emissive: '#ffb300', emissiveIntensity: 0.7, roughness: 0.3 });
  s.userData.star = i;
  scene.add(s); pickables.push(s);
  return s;
});
let found = 0;

/* ───────── 7. 카메라 움직임 (정거장 사이를 부드럽게) ───────── */
const placeById = id => PLACES.find(p => p.id === id);
// 로드뷰처럼: 건물 앞 길(사람 눈보다 조금 높은 곳)에서 올려다보는 자리를, 앞을 가리는 것이 없는 쪽으로 자동으로 찾는다
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
const viewCache = {};
const _ray = new THREE.Raycaster(), _a = new THREE.Vector3(), _b = new THREE.Vector3();
function streetView(p) {
  if (viewCache[p.id]) return viewCache[p.id];
  scene.updateMatrixWorld(true);
  const tall = Math.min(p.H || 6, 18), field = p.kind === 'field';
  const ty = field ? 0.5 : tall * 0.42;
  const reach = field ? 24 : 8 + Math.max(p.w || 8, tall * 1.1) * 1.05;
  const camH = field ? 6 : 2.2;
  const pref = p.cam?.yaw ?? 0.45;
  const others = [...occluders];
  for (const q of PLACES) if (q.id !== p.id) placeGroups[q.id].traverse(o => o.isMesh && others.push(o));
  let best = null;
  for (let k = 0; k < 24; k++) {
    const yaw = pref + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * (Math.PI / 12);
    for (const dist of [reach, reach * 1.3]) {
      const cx = p.x + Math.sin(yaw) * dist, cz = p.z + Math.cos(yaw) * dist;
      if (blockers.some(([bx, bz, hw, hd]) => Math.abs(cx - bx) < hw && Math.abs(cz - bz) < hd)) continue;
      _a.set(cx, camH, cz);
      let clear = 0;
      for (const hy of [ty * 0.5, ty, ty * 1.6]) {
        _b.set(p.x, hy, p.z).sub(_a);
        const len = _b.length();
        _ray.set(_a, _b.normalize());
        _ray.far = Math.max(1, len - Math.min(p.w || 4, p.d || 4) * 0.5);
        if (!_ray.intersectObjects(others, false).length) clear++;
      }
      const score = clear * 10 - Math.abs(wrap(yaw - pref)) - (dist > reach ? 2 : 0);
      if (!best || score > best.score) best = { score, yaw, dist };
    }
    if (best && best.score >= 29) break;
  }
  return (viewCache[p.id] = { t: [p.x, ty, p.z], dist: best.dist, yaw: best.yaw, pitch: Math.atan2(camH - ty, best.dist) });
}
function placePose(p) {
  const v = streetView(p);
  const narrow = innerWidth < 720 ? 1.35 : 1; // 세로 화면은 조금 더 멀리서
  const pose = { t: [...v.t], dist: v.dist * narrow, yaw: v.yaw, pitch: v.pitch };
  if (innerWidth > 720) { // 오른쪽 설명 카드에 가리지 않게 건물을 화면 왼쪽으로
    const s = pose.dist * 0.2;
    pose.t = [pose.t[0] + Math.cos(pose.yaw) * s, pose.t[1], pose.t[2] - Math.sin(pose.yaw) * s];
  }
  return pose;
}
// 카메라가 서는 자리 가까이의 나무·가로등은 치운다(카메라 바로 앞을 가리지 않게)
function clearTreesAround(points) {
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  trees.forEach(([x, z], i) => {
    if (!points.some(([px, pz]) => Math.hypot(x - px, z - pz) < 5)) return;
    trunkIM.setMatrixAt(i, zero);
    for (let k = 0; k < 3; k++) crownIM.setMatrixAt(i * 3 + k, zero);
  });
  trunkIM.instanceMatrix.needsUpdate = crownIM.instanceMatrix.needsUpdate = true;
  for (const l of lamps) if (points.some(([px, pz]) => Math.hypot(l.userData.xz[0] - px, l.userData.xz[1] - pz) < 5)) l.visible = false;
}
const POSES = STOPS.map(s => s.place ? placePose(placeById(s.place)) : s);
const eInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const HOLD = 0.38;

const tourEl = document.getElementById('tour');
function progress() {
  const r = tourEl.getBoundingClientRect();
  const span = r.height - innerHeight;
  if (!(span > 0)) return 0;
  return Math.min(1, Math.max(0, -r.top / span)) * (STOPS.length - 1);
}
function tourPose() {
  const p = progress();
  const i = Math.min(STOPS.length - 2, Math.floor(p)), f = p - i;
  const e = f < HOLD ? 0 : eInOut((f - HOLD) / (1 - HOLD));
  const a = POSES[i], b = POSES[i + 1];
  return {
    t: a.t.map((v, k) => v + (b.t[k] - v) * e),
    dist: a.dist + (b.dist - a.dist) * e + Math.sin(e * Math.PI) * 26, // 건물 사이를 날 때는 높이 떠올랐다가 다시 내려앉음
    yaw: a.yaw + wrap(b.yaw - a.yaw) * e,
    pitch: a.pitch + (b.pitch - a.pitch) * e + Math.sin(e * Math.PI) * 0.6,
    stop: f < HOLD + 0.05 ? i : (f > 0.96 ? i + 1 : -1),
  };
}
const cur = { ...POSES[0], t: [...POSES[0].t] };
let focus = null, focusScroll = 0, mouseX = 0;

function applyCamera(dt) {
  const want = focus ? focus : tourPose();
  const k = 1 - Math.exp(-dt * 3.2);
  for (let j = 0; j < 3; j++) cur.t[j] += (want.t[j] - cur.t[j]) * k;
  cur.dist += (want.dist - cur.dist) * k;
  cur.yaw += wrap(want.yaw + mouseX * 0.08 - cur.yaw) * k;
  cur.pitch += (want.pitch - cur.pitch) * k;
  const cp = Math.cos(cur.pitch);
  camera.position.set(cur.t[0] + Math.sin(cur.yaw) * cp * cur.dist, cur.t[1] + Math.sin(cur.pitch) * cur.dist, cur.t[2] + Math.cos(cur.yaw) * cp * cur.dist);
  camera.lookAt(cur.t[0], cur.t[1], cur.t[2]);
  return want.stop ?? -1;
}

/* ───────── 8. 화면 글(설명 띠 · 설명 창) ───────── */
const $ = id => document.getElementById(id);
const hero = $('hero'), caption = $('caption'), panel = $('panel');
let capPlace = null, openId = null;
const numText = p => p.no ? `${p.no}번` : '입구';
function showCaption(stopIdx) {
  hero.classList.toggle('hide', progress() > 0.25);
  const s = STOPS[stopIdx];
  const p = !focus && s && s.place ? placeById(s.place) : null;
  if (p !== capPlace) {
    capPlace = p;
    caption.classList.toggle('show', !!p);
    if (p) {
      $('capNo').textContent = p.no || '★';
      $('capName').textContent = (p.locked ? '🔒 ' : '') + p.name;
      $('capSub').textContent = p.sub;
      $('capDesc').textContent = p.desc;
      $('capItems').innerHTML = p.items.map(i => `<li>${esc(i)}</li>`).join('');
      $('capGo').textContent = p.locked ? '🔒 들어가기' : '자세히 보기';
    }
  }
}
$('capGo').onclick = () => capPlace && openPlace(capPlace);

function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const unlocked = new Set();
function bodyHtml(p) {
  const list = p.items.length ? `<ul>${p.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
  if (p.locked && !unlocked.has(p.id)) {
    return `<p>${esc(p.desc)}</p><div class="lock"><b>🔒 비밀번호를 넣어 주세요</b>
      <input id="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off">
      <p class="err" id="pinErr"></p><button class="btn" id="pinGo">들어가기</button>
      <small>견본 비밀번호는 ${SAMPLE_PIN} 이에요.</small></div>`;
  }
  const ok = p.locked ? `<div class="ok">✅ ${esc(p.name)}에 들어왔어요. (견본 화면)</div>` : '';
  const cta = p.cta ? `<a class="btn" href="${esc(p.cta.href)}">${esc(p.cta.label)}</a>` : '';
  return `${ok}<p>${esc(p.desc)}</p>${list}${cta}`;
}
function renderPanel(p) {
  $('pNo').textContent = numText(p);
  $('pName').textContent = p.name;
  $('pSub').textContent = p.sub;
  $('pBody').innerHTML = bodyHtml(p);
  const go = $('pinGo');
  if (go) {
    const tryPin = () => {
      if ($('pin').value === SAMPLE_PIN) { unlocked.add(p.id); renderPanel(p); }
      else { $('pinErr').textContent = '비밀번호가 달라요. 다시 넣어 주세요.'; $('pin').select(); }
    };
    go.onclick = tryPin;
    $('pin').onkeydown = e => e.key === 'Enter' && tryPin();
    setTimeout(() => $('pin')?.focus({ preventScroll: true }), 450);
  }
}
function openPlace(p) {
  stopAuto();
  focus = placePose(p);
  { const v = viewCache[p.id]; clearTreesAround([1, 1.35].map(k => [v.t[0] + Math.sin(v.yaw) * v.dist * k, v.t[2] + Math.cos(v.yaw) * v.dist * k])); }
  focusScroll = scrollY;
  openId = p.id;
  renderPanel(p);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  showCaption(-1);
}
function closePanel() {
  focus = null;
  openId = null;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}
$('panelClose').onclick = closePanel;
addEventListener('keydown', e => e.key === 'Escape' && closePanel());
addEventListener('scroll', () => { if (focus && Math.abs(scrollY - focusScroll) > 80) closePanel(); }, { passive: true });

const toast = $('toast');
let toastTimer;
function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200); }

/* ───────── 9. 누르기 · 가리키기 ───────── */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let hoverId = null, downAt = null;
function hit(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.intersectObjects(pickables, false).find(h => !h.object.isSprite || h.object.material.opacity > 0.3)?.object;
}
canvas.addEventListener('pointermove', e => {
  mouseX = (e.clientX / innerWidth - 0.5) * 2;
  if (e.pointerType !== 'mouse') return;
  const o = hit(e);
  hoverId = o ? (o.userData.star != null ? 'star' : o.userData.placeId) : null;
  canvas.style.cursor = hoverId ? 'pointer' : '';
});
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) return;
  const o = hit(e);
  if (!o) return;
  if (o.userData.star != null) return catchStar(o);
  openPlace(placeById(o.userData.placeId));
});
function catchStar(s) {
  if (s.userData.got) return;
  s.userData.got = true;
  s.userData.gotAt = performance.now();
  found++;
  $('starCount').textContent = `⭐ 숨은 별 ${found}/5`;
  say(found === 5 ? '🎉 별 5개를 모두 찾았어요!' : `⭐ 별을 찾았어요! (${found}/5)`);
}

/* ───────── 10. 작은 지도 · 자동 둘러보기 · 목록 ───────── */
const map = $('map'), mg = map.getContext('2d');
const M = 80 / ISL.a;
function drawMap() {
  mg.clearRect(0, 0, 170, 170);
  mg.fillStyle = '#bcd7a0'; mg.beginPath(); mg.roundRect(85 + CAMPUS.x0 * M, 85 + CAMPUS.z0 * M, (CAMPUS.x1 - CAMPUS.x0) * M, (CAMPUS.z1 - CAMPUS.z0) * M, 8); mg.fill();
  mg.fillStyle = '#ece1c8';
  mg.fillRect(85 - 62 * M, 85 + 1 * M, 128 * M, 4 * M);
  mg.fillRect(85 - 4 * M, 85 - 33 * M, 4 * M, 63 * M);
  for (const p of PLACES) {
    const x = 85 + p.x * M, y = 85 + p.z * M;
    if (p.kind === 'field') { mg.fillStyle = '#6aa956'; mg.fillRect(x - p.w * M / 2, y - p.d * M / 2, p.w * M, p.d * M); continue; }
    if (!p.feat) { mg.fillStyle = '#9a9484'; mg.fillRect(x - p.w * M / 2, y - p.d * M / 2, p.w * M, p.d * M); }
  }
  for (const p of PLACES) if (p.feat) {
    const x = 85 + p.x * M, y = 85 + p.z * M;
    mg.fillStyle = p.locked ? '#2a2620' : '#0a7cc1';
    mg.beginPath(); mg.arc(x, y, 6.5, 0, 7); mg.fill();
  }
  const cx = 85 + cur.t[0] * M, cy = 85 + cur.t[2] * M;
  mg.strokeStyle = '#e0533a'; mg.lineWidth = 3; mg.beginPath(); mg.arc(cx, cy, 12, 0, 7); mg.stroke();
}
map.addEventListener('click', e => {
  const r = map.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width * 170 - 85) / M, z = ((e.clientY - r.top) / r.height * 170 - 85) / M;
  let best = PLACES[0], bd = 1e9;
  for (const p of PLACES) { const d = Math.hypot(p.x - x, p.z - z); if (d < bd) { bd = d; best = p; } }
  openPlace(best);
});

function scrollForStop(i) {
  const top = tourEl.offsetTop, span = tourEl.offsetHeight - innerHeight;
  return top + (i / (STOPS.length - 1)) * span;
}
let auto = null;
function stopAuto() { if (auto) { cancelAnimationFrame(auto.raf); auto = null; $('autoBtn').textContent = '▶ 자동으로 둘러보기'; } }
$('autoBtn').onclick = () => {
  if (auto) return stopAuto();
  closePanel();
  if (progress() >= STOPS.length - 1.05) scrollTo(0, 0);
  $('autoBtn').textContent = '■ 멈추기';
  auto = { last: performance.now() };
  const step = now => {
    const dt = now - auto.last; auto.last = now;
    scrollBy(0, innerHeight * 0.00025 * dt); // 정거장 하나에 약 4초
    if (progress() >= STOPS.length - 1.001) return stopAuto();
    auto.raf = requestAnimationFrame(step);
  };
  auto.raf = requestAnimationFrame(step);
};
for (const ev of ['wheel', 'touchstart']) addEventListener(ev, stopAuto, { passive: true });
$('homeBtn').onclick = () => { stopAuto(); closePanel(); scrollTo({ top: 0, behavior: 'smooth' }); };

tourEl.style.height = (STOPS.length * 100) + 'vh';
const listed = [...PLACES].sort((a, b) => (b.feat ? 1 : 0) - (a.feat ? 1 : 0) || String(a.no).localeCompare(String(b.no)));
$('cards').innerHTML = listed.map(p => `<button class="card" data-id="${p.id}"><span class="pno">${numText(p)}</span><b>${p.locked ? '🔒 ' : ''}${esc(p.name)}</b><small>${esc(p.sub)}</small></button>`).join('');
$('cards').onclick = e => {
  const c = e.target.closest('.card'); if (!c) return;
  const i = STOPS.findIndex(s => s.place === c.dataset.id);
  if (i >= 0) scrollTo(0, scrollForStop(i));
  else document.getElementById('tour').scrollIntoView();
  setTimeout(() => openPlace(placeById(c.dataset.id)), 60);
};

/* 오늘 날씨(동작구) */
const WX = c => c === 0 ? '맑음' : c <= 3 ? '구름' : c <= 48 ? '안개' : c <= 67 ? '비' : c <= 77 ? '눈' : c <= 82 ? '소나기' : '뇌우';
let wxText = '';
fetch('https://api.open-meteo.com/v1/forecast?latitude=37.4963&longitude=126.9575&current=temperature_2m,weather_code&timezone=Asia%2FSeoul')
  .then(r => r.json()).then(d => { const c = d.current; wxText = ` · ${WX(c.weather_code)} ${Math.round(c.temperature_2m)}°`; }).catch(() => {});
function tickNow() {
  const t = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  $('now').textContent = `서울 동작구 ${t}${wxText}`;
}

/* ───────── 11. 그리기 반복 ───────── */
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = w < 720 ? 55 : 46;
  camera.updateProjectionMatrix();
  STOPS.forEach((s, i) => { if (s.place) POSES[i] = placePose(placeById(s.place)); });
  if (!clearTreesAround.done) {
    clearTreesAround.done = true;
    const pts = [];
    for (const v of Object.values(viewCache)) for (const k of [1, 1.35]) pts.push([v.t[0] + Math.sin(v.yaw) * v.dist * k, v.t[2] + Math.cos(v.yaw) * v.dist * k]);
    clearTreesAround(pts);
  }
  POSES[0].t = w > 900 ? [-44, 0, 10] : [0, 0, -34]; // 넓은 화면은 캠퍼스를 오른쪽에(왼쪽엔 제목)
  POSES[0].dist = w > 900 ? 175 : 235;
  for (const p of PLACES) p.label.scale.set(w < 720 ? 0.22 : 0.14, w < 720 ? 0.047 : 0.03, 1);
}
addEventListener('resize', resize);
resize();

const _v = new THREE.Vector3();
let last = performance.now(), clockTick = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const stop = applyCamera(dt);
  showCaption(stop);
  const T = now / 1000;
  for (const c of clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 170) c.position.x = -170; }
  for (const g of people) {
    const u = g.userData;
    u.u = (u.u + u.v * dt + 1) % 1;
    const bob = Math.abs(Math.sin(T * 9 + u.off * 9)) * 0.04;
    if (u.lane === 0) { g.position.set(-60 + u.u * 124, bob, 3 + u.off); g.rotation.y = u.v > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { g.position.set(-2 + u.off, bob, 28 - u.u * 58); g.rotation.y = u.v > 0 ? Math.PI : 0; }
  }
  for (const c of cars) { const u = c.userData; u.x += u.dir * u.v * dt; if (u.x > 260) u.x = -260; if (u.x < -260) u.x = 260; c.position.set(u.x, 0, u.z); }
  for (const s of stars) {
    s.rotation.y += dt * 1.6;
    if (s.userData.got) {
      const k = (now - s.userData.gotAt) / 900;
      s.position.y = 1.4 + k * 8; s.scale.setScalar(Math.max(0, 1 - k));
      if (k >= 1) s.visible = false;
    } else s.position.y = 1.5 + Math.sin(T * 2 + s.userData.star) * 0.3;
  }
  for (const p of PLACES) {
    const g = placeGroups[p.id];
    const on = hoverId === p.id || openId === p.id;
    g.scale.setScalar(g.scale.x + ((on ? 1.03 : 1) - g.scale.x) * 0.15);
    p.label.position.y = p.top + Math.sin(T * 1.6 + p.x) * 0.25;
    // 둘러보기 건물 이름표는 늘 보이고, 나머지는 가까이 갔을 때만
    const d = camera.position.distanceTo(_v.set(p.x, p.H, p.z));
    const far = innerWidth < 720 && cur.dist > 120; // 휴대폰에서 멀리 볼 땐 이름표를 숨겨 제목과 안 겹치게
    const here = openId || capPlace?.id; // 건물 앞에 섰을 땐 그 건물 이름표만
    p.label.material.opacity = far ? 0 : here && cur.dist < 50 ? (p.id === here ? 1 : 0) : p.feat || openId === p.id ? 1 : Math.min(1, Math.max(0, (62 - d) / 18));
    p.label.visible = p.label.material.opacity > 0.02;
  }
  if ((clockTick -= dt) <= 0) { clockTick = 5; tickNow(); }
  drawMap();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
