// 웨스트민스터홀 모의 강의실 — 캐릭터로 걸어 다니고, 자리에 앉아 앞쪽 큰 화면의 유튜브 강의를 본다.
// 숭실 캠퍼스 마을(village.js)과 따로 그리며, 건물 안으로 들어갈 때만 불러온다.
import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ───────── 1. 바꿀 수 있는 내용 ───────── */
// 강의 영상: 원장님 유튜브 주소가 정해지면 아래 id를 바꾸면 모두에게 적용된다(주소의 v= 뒤 11글자).
const DEFAULT_VIDEO = { id: 'aqz-KE-bpKQ', title: '시험 영상' };
const VIDEO_KEY = 'ssu-room-video';

const $ = id => document.getElementById(id);
const W = 9, ZF = -7, ZB = 9, H = 4.8;            // 강의실 크기(좌우 ±9, 앞 -7, 뒤 9, 높이 4.8m)
const STAGE_Z = -4.4, STAGE_X = 6.6, STAGE_H = 0.18;
const ROWS = [-2.6, -0.6, 1.4, 3.4, 5.4];
const SEAT_X = [-6.2, -4.15, -2.1, 2.1, 4.15, 6.2];
const SCREEN = { w: 7.2, h: 4.05, y: 2.65, z: ZF + 0.14 };
const SPEED = 2.7;

const floorY = (x, z) => (Math.abs(x) < STAGE_X && z < STAGE_Z ? STAGE_H : 0);

let built = false, running = false, onExit = null;
let renderer, css, scene, world, camera, canvas, punch;
let player, others = [], walker, teacher, marker, shadowTex;
const clickables = [];
const sideWalls = { left: new THREE.Group(), right: new THREE.Group(), back: new THREE.Group() };
const seats = [], blocks = [];

/* ───────── 2. 그림 재료 ───────── */
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function woodTex(ctx, w, h) {
  const plankH = h / 8;
  for (let i = 0; i < 8; i++) {
    const shift = (i % 2) * w * 0.37;
    for (let k = -1; k < 3; k++) {
      const x = shift + k * w * 0.5;
      const v = 150 + ((i * 37 + k * 53 + 90) % 34);
      ctx.fillStyle = `rgb(${v + 22},${v - 22},${v - 74})`;
      ctx.fillRect(x, i * plankH, w * 0.5, plankH);
      ctx.strokeStyle = 'rgba(70,40,15,.28)';
      ctx.strokeRect(x, i * plankH, w * 0.5, plankH);
    }
    ctx.strokeStyle = 'rgba(80,50,20,.08)';
    for (let g = 0; g < 7; g++) {
      const y = i * plankH + (g + 0.5) * plankH / 7;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(w * 0.3, y + 3, w * 0.6, y - 3, w, y); ctx.stroke();
    }
  }
}
function textBoard(lines, opt = {}) {
  return canvasTex(1024, 640, (g, w, h) => {
    g.fillStyle = opt.bg || '#f7f8f6'; g.fillRect(0, 0, w, h);
    g.textBaseline = 'top';
    let y = opt.top ?? 70;
    for (const l of lines) {
      g.font = `${l.bold ? 800 : 500} ${l.size || 62}px "Pretendard Variable", Pretendard, sans-serif`;
      g.fillStyle = l.color || '#17508c';
      g.fillText(l.text, 74, y);
      y += (l.size || 62) * 1.5;
    }
  });
}
function nameTag(text, color) {
  const t = canvasTex(320, 96, (g, w, h) => {
    g.font = '700 46px "Pretendard Variable", Pretendard, sans-serif';
    const tw = Math.min(w - 8, g.measureText(text).width + 52);
    g.fillStyle = color; g.beginPath(); g.roundRect((w - tw) / 2, 12, tw, 72, 36); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, 50);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, sizeAttenuation: false }));
  s.scale.set(0.1, 0.03, 1);
  return s;
}

/* ───────── 3. 강의실 ───────── */
function box(w, h, d, mat, x, y, z, shadow = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  world.add(m);
  return m;
}
function buildRoom() {
  const std = (color, rough = 0.75, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const wall = std('#ece6da', 0.9), dark = std('#2c3138', 0.45, 0.3), trim = std('#8a5a33', 0.55), navy = std('#1f4f86', 0.6);

  const floorTex = canvasTex(1024, 1024, woodTex, [8, 7]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2 + 17, ZB - ZF + 17), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.48 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, (ZB + ZF) / 2);
  floor.receiveShadow = true; floor.userData.kind = 'floor';
  world.add(floor); clickables.push(floor);

  // 벽·천장(두꺼운 판이라 어느 쪽에서 봐도 빈틈이 없다)
  const Zc = (ZB + ZF) / 2, L = ZB - ZF;
  box(W * 2 + 17, 0.3, L + 17, std('#f6f3ec', 0.9), 0, H + 0.15, Zc, false);
  box(W * 2 + 1, H, 0.3, std('#e2d9c8', 0.9), 0, H / 2, ZF - 0.15, false);
  // 양옆·뒤 벽은 안쪽에서만 보이는 판이다. 카메라가 벽 뒤로 물러나면 벽이 비쳐서, 벽 앞에 서도 내 캐릭터가 잘 보인다.
  const inward = (w, ry, x, z, group) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), wall);
    m.rotation.y = ry; m.position.set(x, H / 2, z); m.receiveShadow = true; group.add(m);
  };
  for (const g of Object.values(sideWalls)) world.add(g);
  inward(L + 8, Math.PI / 2, -W, Zc + 4, sideWalls.left);
  inward(L + 8, -Math.PI / 2, W, Zc + 4, sideWalls.right);
  inward(W * 2, Math.PI, 0, ZB, sideWalls.back);
  // 벽 아래쪽 나무 띠
  sideWalls.left.add(box(0.06, 1.05, L + 8, trim, -W + 0.03, 0.525, Zc + 4, false));
  sideWalls.right.add(box(0.06, 1.05, L + 8, trim, W - 0.03, 0.525, Zc + 4, false));
  sideWalls.back.add(box(W * 2, 1.05, 0.06, trim, 0, 0.525, ZB - 0.03, false));

  // 천장 조명
  const lamp = new THREE.MeshBasicMaterial({ color: '#fffaf0' });
  for (const z of [-4.5, -0.5, 3.5, 7.2]) for (const x of [-5.5, 0, 5.5])
    box(2.6, 0.04, 0.5, lamp, x, H - 0.02, z, false);

  // 왼쪽 창문: 바깥은 캠퍼스 하늘과 나무 그림
  const sky = canvasTex(512, 512, (g, w, h) => {
    const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#9fd0f2'); s.addColorStop(0.65, '#e6f4fb'); g.fillStyle = s; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5f9a59';
    for (let i = 0; i < 26; i++) { g.beginPath(); g.arc((i * 83) % w, h * 0.8 + (i * 47) % 70, 46 + (i * 13) % 34, 0, 7); g.fill(); }
    g.fillStyle = '#7fb06e';
    for (let i = 0; i < 18; i++) { g.beginPath(); g.arc((i * 127) % w, h * 0.86 + (i * 29) % 60, 40, 0, 7); g.fill(); }
  });
  const skyMat = new THREE.MeshBasicMaterial({ map: sky, toneMapped: false });
  for (const z of [-3.4, 0.6, 4.6]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 2.7), skyMat);
    p.rotation.y = Math.PI / 2; p.position.set(-W + 0.02, 2.65, z); sideWalls.left.add(p);
    for (const [zz, w] of [[z - 1.55, 0.09], [z + 1.55, 0.09], [z, 0.05]]) sideWalls.left.add(box(0.1, 2.8, w, dark, -W + 0.05, 2.65, zz, false));
    for (const y of [1.3, 4.0]) sideWalls.left.add(box(0.1, 0.09, 3.2, dark, -W + 0.05, y, z, false));
  }

  // 교단
  const stageMat = new THREE.MeshStandardMaterial({ map: canvasTex(1024, 1024, woodTex, [3, 1]), roughness: 0.5, color: '#c9b49c' });
  const stage = box(STAGE_X * 2, STAGE_H, STAGE_Z - ZF, stageMat, 0, STAGE_H / 2, (ZF + STAGE_Z) / 2, false);
  stage.userData.kind = 'floor'; clickables.push(stage);

  // 앞쪽 벽: 큰 화면 틀과 칠판 둘
  box(8.0, 0.08, 0.3, dark, 0, 0.92, ZF + 0.15, false);
  box(SCREEN.w + 0.28, SCREEN.h + 0.28, 0.1, dark, 0, SCREEN.y, ZF + 0.06, false);
  const boardFrame = std('#b8bdc2', 0.4, 0.5);
  const left = textBoard([
    { text: '2026-2학기', size: 54, color: '#5a6573' },
    { text: '현장역량강화', size: 54, color: '#5a6573' },
    { text: '영유아 교육현장 속의', size: 72, bold: 1 },
    { text: 'AI 교육 혁신', size: 92, bold: 1, color: '#0a7cc1' },
  ], { top: 66 });
  const right = textBoard([
    { text: '오늘의 순서', size: 64, bold: 1 },
    { text: '1. 현장 적용 사례 발표', size: 54, color: '#26303c' },
    { text: '2. 질의응답', size: 54, color: '#26303c' },
    { text: '3. 실습·체험 워크숍', size: 54, color: '#26303c' },
  ], { top: 76 });
  [[-6.15, left], [6.15, right]].forEach(([x, tex]) => {
    box(4.0, 2.56, 0.08, boardFrame, x, 2.5, ZF + 0.05, false);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.86, 2.42), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3 }));
    p.position.set(x, 2.5, ZF + 0.1); world.add(p);
  });

  // 교탁
  box(1.1, 1.08, 0.62, trim, -4.7, STAGE_H + 0.54, -5.2);
  box(1.2, 0.05, 0.72, std('#6d4427', 0.5), -4.7, STAGE_H + 1.1, -5.2);
  box(0.5, 0.02, 0.34, dark, -4.7, STAGE_H + 1.14, -5.2);
  blocks.push(rect(-4.7, -5.2, 0.6, 0.36));

  // 책상·의자 (같은 모양이 많으니 한 벌을 되풀이해 가볍게 그린다)
  const tableMat = std('#e8e1d3', 0.45), legMat = std('#4b5158', 0.45, 0.5), chairMat = std('#2f6aa8', 0.6);
  const groups = [-4.15, 4.15];
  const tTop = new THREE.InstancedMesh(new THREE.BoxGeometry(6, 0.05, 0.62), tableMat, ROWS.length * 2);
  const tFront = new THREE.InstancedMesh(new THREE.BoxGeometry(6, 0.5, 0.03), legMat, ROWS.length * 2);
  const seatN = ROWS.length * SEAT_X.length;
  const cSeat = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.05, 0.46), chairMat, seatN);
  const cBack = new THREE.InstancedMesh(new THREE.BoxGeometry(0.46, 0.44, 0.05), chairMat, seatN);
  const cPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.05, 0.42, 8), legMat, seatN);
  const m4 = new THREE.Matrix4();
  let t = 0, c = 0;
  for (const r of ROWS) {
    for (const x of groups) {
      tTop.setMatrixAt(t, m4.makeTranslation(x, 0.74, r));
      tFront.setMatrixAt(t, m4.makeTranslation(x, 0.47, r - 0.27));
      t++;
      blocks.push(rect(x, r, 3.0, 0.31));
    }
    for (const x of SEAT_X) {
      const z = r + 0.62;
      cSeat.setMatrixAt(c, m4.makeTranslation(x, 0.45, z));
      cBack.setMatrixAt(c, m4.makeTranslation(x, 0.72, z + 0.23));
      cPole.setMatrixAt(c, m4.makeTranslation(x, 0.22, z));
      const b = rect(x, z, 0.24, 0.24);
      blocks.push(b);
      seats.push({ x, z, row: r, block: b, by: null });
      c++;
    }
  }
  for (const m of [tTop, tFront, cSeat, cBack, cPole]) { m.castShadow = true; m.receiveShadow = true; world.add(m); }
  tTop.userData.kind = tFront.userData.kind = 'desk';
  cSeat.userData.kind = cBack.userData.kind = 'desk';
  clickables.push(tTop, tFront, cSeat, cBack);

  // 뒷문 · 오른쪽 벽 게시판 · 시계 · 화분
  const door = box(1.5, 2.5, 0.08, std('#7a4e2c', 0.55), 0, 1.25, ZB - 0.05, false);
  door.userData.kind = 'door'; clickables.push(door); sideWalls.back.add(door);
  sideWalls.back.add(box(0.06, 0.34, 0.08, std('#cfd3d6', 0.3, 0.8), -0.55, 1.2, ZB - 0.13, false));
  const exitSign = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.34), new THREE.MeshBasicMaterial({ map: textTag('나가는 문'), toneMapped: false }));
  exitSign.rotation.y = Math.PI; exitSign.position.set(0, 2.8, ZB - 0.02); sideWalls.back.add(exitSign);

  const notice = textBoard([
    { text: '숭실대학교 교육대학원', size: 58, bold: 1 },
    { text: '유아교육전공', size: 58, bold: 1 },
    { text: '모의 강의실입니다.', size: 50, color: '#26303c' },
    { text: '자리에 앉아 강의를 들어 보세요.', size: 50, color: '#26303c' },
  ], { bg: '#fff9ea' });
  sideWalls.right.add(box(0.08, 2.16, 3.5, trim, W - 0.05, 2.45, 1.4, false));
  const np = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.96), new THREE.MeshStandardMaterial({ map: notice, roughness: 0.7 }));
  np.rotation.y = -Math.PI / 2; np.position.set(W - 0.1, 2.45, 1.4); sideWalls.right.add(np);

  const clockCan = document.createElement('canvas'); clockCan.width = clockCan.height = 256;
  clock.tex = new THREE.CanvasTexture(clockCan); clock.tex.colorSpace = THREE.SRGBColorSpace; clock.can = clockCan;
  const cm = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshStandardMaterial({ map: clock.tex, roughness: 0.4 }));
  cm.rotation.y = -Math.PI / 2; cm.position.set(W - 0.05, 3.9, -3.8); sideWalls.right.add(cm);
  drawClock();

  const pot = std('#b5764a', 0.8), leaf = std('#4d8a4c', 0.8);
  for (const [x, z] of [[-8.3, 8.3], [8.3, 8.3], [8.3, -3.8]]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.5, 18), pot); p.position.set(x, 0.25, z); world.add(p);
    for (let i = 0; i < 7; i++) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), leaf);
      l.scale.set(0.55, 1.5, 0.55);
      l.position.set(x + Math.cos(i * 0.9) * 0.2, 0.9 + (i % 3) * 0.18, z + Math.sin(i * 0.9) * 0.2);
      l.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i) * 0.5);
      world.add(l);
    }
    blocks.push(rect(x, z, 0.36, 0.36));
  }

  // 빛: 창문 쪽 해빛 + 천장 조명 느낌
  scene.add(new THREE.HemisphereLight('#fffdf6', '#b49c84', 1.35));
  const sun = new THREE.DirectionalLight('#fff0d8', 1.5);
  sun.position.set(-13, 7.5, 3); sun.target.position.set(1, 0, 1);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006;
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 12, bottom: -12, near: 1, far: 34 });
  scene.add(sun, sun.target);

  shadowTex = canvasTex(128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 4, w / 2, w / 2, w / 2);
    r.addColorStop(0, 'rgba(30,20,10,.42)'); r.addColorStop(1, 'rgba(30,20,10,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, w);
  });

  marker = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.28, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  marker.rotation.x = -Math.PI / 2; marker.position.y = 0.03; world.add(marker);
}
function textTag(text) {
  return canvasTex(440, 136, (g, w, h) => {
    g.fillStyle = '#2f7d4f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '700 64px "Pretendard Variable", Pretendard, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
  });
}
const clock = { tex: null, can: null, t: 0 };
function drawClock() {
  const g = clock.can.getContext('2d'), R = 128, d = new Date();
  g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#333'; g.lineWidth = 8; g.beginPath(); g.arc(R, R, 118, 0, 7); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.lineWidth = 5; g.beginPath(); g.moveTo(R + Math.sin(a) * 96, R - Math.cos(a) * 96); g.lineTo(R + Math.sin(a) * 110, R - Math.cos(a) * 110); g.stroke(); }
  const hand = (a, len, w) => { g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(R, R); g.lineTo(R + Math.sin(a) * len, R - Math.cos(a) * len); g.stroke(); };
  hand((d.getHours() % 12 + d.getMinutes() / 60) * Math.PI / 6, 62, 9);
  hand(d.getMinutes() * Math.PI / 30, 92, 6);
  clock.tex.needsUpdate = true;
}

/* ───────── 4. 다닐 수 있는 곳 · 길찾기 ───────── */
const R_BODY = 0.2, CELL = 0.2;
const NX = Math.ceil((W * 2) / CELL), NZ = Math.ceil((ZB - ZF) / CELL);
function rect(x, z, hx, hz) { return { x0: x - hx, x1: x + hx, z0: z - hz, z1: z + hz }; }
function free(x, z, ignore) {
  if (Math.abs(x) > W - 0.3 || z < ZF + 0.5 || z > ZB - 0.35) return false;
  for (const b of blocks) {
    if (b === ignore) continue;
    if (x > b.x0 - R_BODY && x < b.x1 + R_BODY && z > b.z0 - R_BODY && z < b.z1 + R_BODY) return false;
  }
  return true;
}
const cellOf = (x, z) => [Math.floor((x + W) / CELL), Math.floor((z - ZF) / CELL)];
const posOf = (i, j) => [(i + 0.5) * CELL - W, (j + 0.5) * CELL + ZF];
function nearestFree(x, z, ignore) {
  if (free(x, z, ignore)) return [x, z];
  for (let r = 0.2; r < 5; r += 0.2) for (let a = 0; a < 16; a++) {
    const px = x + Math.cos(a * Math.PI / 8) * r, pz = z + Math.sin(a * Math.PI / 8) * r;
    if (free(px, pz, ignore)) return [px, pz];
  }
  return [x, z];
}
function clearLine(ax, az, bx, bz, ignore) {
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.1);
  for (let i = 0; i <= n; i++) { const k = i / (n || 1); if (!free(ax + (bx - ax) * k, az + (bz - az) * k, ignore)) return false; }
  return true;
}
function findPath(fx, fz, tx, tz, ignore) {
  const [si, sj] = cellOf(...nearestFree(fx, fz, ignore)), [gi, gj] = cellOf(tx, tz);
  const prev = new Int32Array(NX * NZ).fill(-1), q = [si + sj * NX];
  prev[q[0]] = q[0];
  const ok = (i, j) => { const [x, z] = posOf(i, j); return free(x, z, ignore); };
  let found = -1, best = q[0], bestD = Infinity;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], i = c % NX, j = (c - i) / NX, d = Math.abs(i - gi) + Math.abs(j - gj);
    if (d < bestD) { bestD = d; best = c; }
    if (d === 0) { found = c; break; }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj, n = a + b * NX;
      if (a < 0 || b < 0 || a >= NX || b >= NZ || prev[n] !== -1 || !ok(a, b)) continue;
      prev[n] = c; q.push(n);
    }
  }
  const cells = [];
  for (let c = found >= 0 ? found : best; ; c = prev[c]) { cells.push(c); if (prev[c] === c) break; }
  cells.reverse();
  // 지그재그를 없애 곧게 걷도록, 보이는 칸까지 건너뛴다
  const pts = cells.map(c => posOf(c % NX, (c - c % NX) / NX));
  pts.push([tx, tz]);
  const out = []; let ax = fx, az = fz, k = 0;
  while (k < pts.length) {
    let n = pts.length - 1;
    while (n > k && !clearLine(ax, az, pts[n][0], pts[n][1], ignore)) n--;
    out.push(pts[n]); [ax, az] = pts[n]; k = n + 1;
  }
  return out;
}

/* ───────── 5. 캐릭터 ───────── */
const G = {};
function geoms() {
  G.head = new THREE.SphereGeometry(0.31, 28, 22);
  G.hair = new THREE.SphereGeometry(0.325, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56);
  G.body = new THREE.CapsuleGeometry(0.19, 0.24, 8, 18);
  G.limb = new THREE.CapsuleGeometry(0.065, 0.24, 6, 12);
  G.hand = new THREE.SphereGeometry(0.075, 12, 10);
  G.shoe = new THREE.SphereGeometry(0.095, 12, 10);
  G.eye = new THREE.SphereGeometry(0.035, 10, 8);
  G.bag = new THREE.BoxGeometry(0.3, 0.34, 0.14);
  G.lens = new THREE.TorusGeometry(0.062, 0.011, 8, 22);
}
function makeChar({ skin = '#f4cfae', hair = '#2f241c', top = '#2f6aa8', pants = '#39414d', name, tag = '#44505e', bag, glasses, longHair }) {
  const m = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.62 });
  const sk = m(skin), hr = m(hair), tp = m(top), pt = m(pants), blk = new THREE.MeshStandardMaterial({ color: '#191512', roughness: 0.3 });
  const root = new THREE.Group(), rig = new THREE.Group();
  root.add(rig);
  const add = (geo, mat, x, y, z, parent = rig) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); parent.add(o); return o; };

  add(G.body, tp, 0, 0.64, 0).scale.set(1, 1, 0.82);
  const head = new THREE.Group(); head.position.y = 1.08; rig.add(head);
  add(G.head, sk, 0, 0, 0, head);
  add(G.hair, hr, 0, 0.03, -0.02, head).rotation.x = -0.28;
  if (longHair) add(G.head, hr, 0, -0.12, -0.09, head).scale.set(1.04, 0.86, 0.78);
  add(G.eye, blk, -0.11, 0.0, 0.285, head); add(G.eye, blk, 0.11, 0.0, 0.285, head);
  if (glasses) {
    const fr = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.4 });
    add(G.lens, fr, -0.11, 0, 0.3, head); add(G.lens, fr, 0.11, 0, 0.3, head);
  }
  const limb = (x, y, mat, isArm) => {
    const p = new THREE.Group(); p.position.set(x, y, 0); rig.add(p);
    add(G.limb, mat, 0, -0.17, 0, p);
    if (isArm) add(G.hand, sk, 0, -0.36, 0, p);
    else add(G.shoe, blk, 0, -0.37, 0.03, p).scale.set(0.9, 0.62, 1.4);
    return p;
  };
  const armL = limb(0.25, 0.8, tp, true), armR = limb(-0.25, 0.8, tp, true);
  const legL = limb(0.1, 0.42, pt), legR = limb(-0.1, 0.42, pt);
  if (bag) add(G.bag, m(bag), 0, 0.68, -0.21);

  const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.012; root.add(blob);
  if (name) { const s = nameTag(name, tag); s.position.y = 1.62; root.add(s); root.userData.nameTag = s; }
  world.add(root);
  return { root, rig, head, armL, armR, legL, legR, walk: 0, moving: false, pose: 'idle', wave: 0, hand: false, seat: null, off: Math.random() * 10 };
}
const ease = (o, k, v, f) => { o[k] += (v - o[k]) * f; };
function animate(c, dt, T) {
  const f = Math.min(1, dt * 12);
  const sit = c.pose === 'sit';
  if (c.moving) c.walk += dt * 11;
  const sw = c.moving ? Math.sin(c.walk) : 0;
  ease(c.legL.rotation, 'x', sit ? -1.42 : sw * 0.72, f);
  ease(c.legR.rotation, 'x', sit ? -1.42 : -sw * 0.72, f);
  ease(c.rig.position, 'y', c.moving ? Math.abs(Math.cos(c.walk)) * 0.035 : Math.sin(T * 2 + c.off) * 0.006, f);
  ease(c.armL.rotation, 'x', sit ? -0.95 : -sw * 0.6, f);
  ease(c.armL.rotation, 'z', 0.1, f);
  let rx = sit ? -0.95 : sw * 0.6, rz = -0.1;
  if (c.hand) { rx = -3.0; rz = 0.1; }
  if (c.wave > 0) { c.wave -= dt; rx = 0; rz = -2.55 + Math.sin(T * 13) * 0.32; }
  if (c.gesture) { rx = -1.15 + Math.sin(T * 2.3 + c.off) * 0.3; rz = -0.5; }
  ease(c.armR.rotation, 'x', rx, f);
  ease(c.armR.rotation, 'z', rz, f);
  c.head.rotation.y = Math.sin(T * 0.45 + c.off) * (c === player ? 0 : 0.2);
  c.head.rotation.x = c.nod ? Math.sin(T * 1.8 + c.off) * 0.09 : 0;
}
function turnTo(c, a, dt, speed = 11) {
  let d = a - c.root.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  c.root.rotation.y += d * Math.min(1, dt * speed);
}

function buildPeople() {
  geoms();
  player = makeChar({ name: '나', tag: '#0a7cc1', top: '#d94f3d', pants: '#34404f', hair: '#5a3a24', bag: '#f0b429' });
  player.root.position.set(0, 0, 7.6);
  player.root.rotation.y = Math.PI;

  const look = [
    { top: '#f1a65a', hair: '#2e2019', longHair: 1 }, { top: '#6fa86a', hair: '#1f1a17' },
    { top: '#8d6cc0', hair: '#3b2518', longHair: 1 }, { top: '#e7e3da', pants: '#5c6b82', hair: '#1f1a17', glasses: 1 },
    { top: '#d6688a', hair: '#4a2c1c', longHair: 1 }, { top: '#4aa3b5', hair: '#2a211b' },
    { top: '#c9a23f', hair: '#332318', longHair: 1, glasses: 1 }, { top: '#5a7bc8', hair: '#20191a' },
  ];
  const at = [2, 7, 10, 15, 19, 22, 26, 3];
  look.forEach((l, i) => {
    const s = seats[at[i]], c = makeChar({ ...l, name: '수강생', tag: 'rgba(60,70,84,.82)' });
    s.by = c; c.seat = s; c.pose = 'sit';
    c.root.position.set(s.x, 0.03, s.z); c.root.rotation.y = Math.PI; c.nod = i % 3 === 0;
    c.nextHand = 8 + i * 5;
    others.push(c);
  });
  teacher = makeChar({ name: '강사', tag: '#17508c', top: '#2b3a55', pants: '#2b3039', hair: '#2a1e18', longHair: 1, glasses: 1 });
  teacher.root.position.set(-4.7, STAGE_H, -5.9);
  others.push(teacher);

  walker = makeChar({ name: '수강생', tag: 'rgba(60,70,84,.82)', top: '#3f9b86', hair: '#2d211a', bag: '#7a5a9e' });
  walker.root.position.set(8, 0, 6.5); walker.dir = -1; walker.moving = true;
  others.push(walker);
}

/* ───────── 6. 큰 화면(유튜브) ───────── */
let yt = null, ytReady = false, playing = false, video = null;
const safeGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* 저장 안 돼도 재생엔 지장 없음 */ } };
function parseYouTube(text) {
  const t = String(text || '').trim();
  const m = t.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : /^[\w-]{11}$/.test(t) ? t : null;
}
function setStatus(msg) { $('roomVideoMsg').textContent = msg || ''; }
function buildScreen() {
  // 화면 자리에 3D 그림을 뚫어 뒤쪽 유튜브가 보이게 한다. 사람이 앞을 지나가면 영상을 가린다.
  punch = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN.w, SCREEN.h),
    new THREE.MeshBasicMaterial({ color: 0, opacity: 0, transparent: true, blending: THREE.NoBlending }));
  punch.position.set(0, SCREEN.y, SCREEN.z);
  punch.userData.kind = 'screen';
  scene.add(punch); clickables.push(punch);

  const holder = document.createElement('div');
  holder.className = 'room-yt';
  holder.innerHTML = '<div id="roomYt"></div>';
  const obj = new CSS3DObject(holder);
  obj.position.set(0, SCREEN.y, SCREEN.z);
  obj.scale.setScalar(SCREEN.w / 1280);
  scene.add(obj);
  loadPlayer();
}
function loadPlayer() {
  const saved = parseYouTube(safeGet(VIDEO_KEY));
  video = saved ? { id: saved, title: '넣어 둔 영상' } : DEFAULT_VIDEO;
  const start = () => {
    yt = new YT.Player('roomYt', {
      width: 1280, height: 720, videoId: video.id,
      playerVars: { playsinline: 1, rel: 0, modestbranding: 1, controls: 1, origin: location.origin },
      events: {
        onReady: () => { ytReady = true; setStatus(''); updatePlay(); },
        onStateChange: e => { playing = e.data === 1 || e.data === 3; updatePlay(); },
        onError: () => { playing = false; updatePlay(); setStatus('이 영상은 강의실에서 재생할 수 없어요. 유튜브에서 「일부 공개」와 「퍼가기 허용」을 확인해 주세요.'); },
      },
    });
  };
  if (window.YT?.Player) return start();
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => { prev?.(); start(); };
  const s = document.createElement('script');
  s.src = 'https://www.youtube.com/iframe_api';
  s.onerror = () => setStatus('유튜브를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.');
  document.head.appendChild(s);
}
function updatePlay() { $('roomPlay').textContent = playing ? '⏸ 잠시 멈춤' : '▶ 강의 재생'; }
function togglePlay() {
  if (!ytReady) return setStatus('영상을 준비하고 있어요. 잠시 뒤 다시 눌러 주세요.');
  setStatus('');
  playing ? yt.pauseVideo() : yt.playVideo();
}

/* ───────── 7. 움직이기 ───────── */
const cam = { yaw: 0, pitch: 0.34, dist: 5.6, pos: new THREE.Vector3(0, 3, 12.9), look: new THREE.Vector3(0, 1.1, 7.6) };
const keys = new Set();
let path = [], arrive = null, big = false;

function goTo(x, z, then, ignore) {
  x = THREE.MathUtils.clamp(x, -W + 0.4, W - 0.4);
  z = THREE.MathUtils.clamp(z, ZF + 0.6, ZB - 0.45);
  const [gx, gz] = ignore ? [x, z] : nearestFree(x, z);
  path = findPath(player.root.position.x, player.root.position.z, gx, gz, ignore);
  arrive = then || null;
  path.ignore = ignore;
  marker.position.set(gx, floorY(gx, gz) + 0.03, gz);
  marker.material.opacity = 0.9;
  hideHint();
}
function standUp() {
  const s = player.seat;
  if (!s) return;
  s.by = null; player.seat = null; player.pose = 'idle';
  player.root.position.z = s.z + 0.5;
  cam.seated = false; cam.pitch = 0.34; cam.dist = 5.6;
  player.root.userData.nameTag.visible = true;
  updateSeatBtn();
}
function sitOn(s) {
  s.by = player; player.seat = s; player.pose = 'sit';
  player.root.position.set(s.x, 0.03, s.z);
  cam.seated = true; cam.yaw = 0; cam.pitch = 0.1; cam.dist = 2.5;
  player.root.userData.nameTag.visible = false;
  updateSeatBtn();
}
function freeSeatNear(x, z) {
  let best = null, d = Infinity;
  for (const s of seats) {
    if (s.by) continue;
    const q = Math.hypot(s.x - x, s.z - z);
    if (q < d) { d = q; best = s; }
  }
  return best;
}
function goSit(x, z) {
  const s = freeSeatNear(x, z);
  if (!s) return;
  standUp();
  goTo(s.x, s.z, () => sitOn(s), s.block);
}
function updateSeatBtn() { $('roomSit').textContent = player.seat ? '🚶 일어나기' : '🪑 자리에 앉기'; }
function hideHint() { $('roomHint').classList.add('hide'); }

function stepPlayer(dt) {
  const p = player.root.position;
  let dx = 0, dz = 0;
  if (keys.has('ArrowUp') || keys.has('KeyW')) dz += 1;
  if (keys.has('ArrowDown') || keys.has('KeyS')) dz -= 1;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) dx -= 1;
  if (keys.has('ArrowRight') || keys.has('KeyD')) dx += 1;
  player.moving = false;

  if (dx || dz) {
    if (player.seat) standUp();
    path = []; arrive = null; hideHint();
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    let mx = fx * dz + rx * dx, mz = fz * dz + rz * dx;
    const n = Math.hypot(mx, mz) || 1; mx /= n; mz /= n;
    const s = SPEED * dt;
    if (free(p.x + mx * s, p.z + mz * s)) { p.x += mx * s; p.z += mz * s; player.moving = true; }
    else if (free(p.x + mx * s, p.z)) { p.x += mx * s; player.moving = true; }
    else if (free(p.x, p.z + mz * s)) { p.z += mz * s; player.moving = true; }
    turnTo(player, Math.atan2(mx, mz), dt);
  } else if (path.length) {
    const [tx, tz] = path[0];
    const dX = tx - p.x, dZ = tz - p.z, d = Math.hypot(dX, dZ), s = SPEED * dt;
    if (d <= s) {
      p.x = tx; p.z = tz; path.shift();
      if (!path.length) { marker.material.opacity = 0; const a = arrive; arrive = null; a?.(); }
    } else {
      p.x += dX / d * s; p.z += dZ / d * s;
      turnTo(player, Math.atan2(dX, dZ), dt);
    }
    player.moving = true;
  }
  if (player.seat) turnTo(player, Math.PI, dt, 8);
  else p.y += (floorY(p.x, p.z) - p.y) * Math.min(1, dt * 14);
  if (marker.material.opacity > 0) marker.rotation.z += dt;
}
function stepOthers(dt, T) {
  const w = walker.root.position;
  w.z += walker.dir * 1.25 * dt;
  if (w.z < -3) walker.dir = 1;
  if (w.z > 7) walker.dir = -1;
  turnTo(walker, walker.dir < 0 ? Math.PI : 0, dt, 4);
  teacher.gesture = playing;
  for (const c of others) {
    if (c.seat && (c.nextHand -= dt) <= 0) {
      if (c.hand) { c.hand = false; c.nextHand = 16 + Math.random() * 18; }
      else { c.hand = true; c.nextHand = 3; }
    }
    animate(c, dt, T);
  }
}
function stepCamera(dt) {
  const k = 1 - Math.exp(-dt * 6);
  if (big) {
    const fit = Math.tan(camera.fov * Math.PI / 360);
    const d = Math.max(SCREEN.h / 2 / fit, SCREEN.w / 2 / (fit * camera.aspect)) * 1.03;
    cam.pos.lerp(new THREE.Vector3(0, SCREEN.y, SCREEN.z + d), k * 1.5);
    cam.look.lerp(new THREE.Vector3(0, SCREEN.y, SCREEN.z), k * 1.5);
    if (cam.pos.distanceTo(new THREE.Vector3(0, SCREEN.y, SCREEN.z + d)) < 0.12) world.visible = false;
  } else {
    const p = player.root.position, ty = cam.seated ? 1.72 : 1.05;
    const cp = Math.cos(cam.pitch);
    const want = new THREE.Vector3(
      p.x + Math.sin(cam.yaw) * cp * cam.dist,
      p.y + ty + Math.sin(cam.pitch) * cam.dist,
      p.z + Math.cos(cam.yaw) * cp * cam.dist);
    // 천장·앞벽에 닿으면 각도는 그대로 두고 카메라만 당긴다
    const by = p.y + ty;
    let t = 1;
    if (want.y > H - 0.25) t = Math.min(t, (H - 0.25 - by) / (want.y - by));
    if (want.z < ZF + 0.4) t = Math.min(t, (ZF + 0.4 - p.z) / (want.z - p.z));
    want.set(p.x + (want.x - p.x) * t, by + (want.y - by) * t, p.z + (want.z - p.z) * t);
    cam.pos.lerp(want, k);
    cam.look.lerp(new THREE.Vector3(p.x, p.y + ty, p.z), k * 1.4);
  }
  camera.position.copy(cam.pos);
  camera.lookAt(cam.look);
  sideWalls.left.visible = cam.pos.x > -W;
  sideWalls.right.visible = cam.pos.x < W;
  sideWalls.back.visible = cam.pos.z < ZB;
}
function setBig(on) {
  big = on;
  document.querySelector('.room').classList.toggle('big', on);
  $('roomBig').textContent = on ? '↩ 강의실로 돌아가기' : '⛶ 크게 보기';
  world.visible = true;
  // 크게 볼 땐 유튜브의 재생 막대를 직접 누를 수 있게 3D 그림이 손가락을 가로막지 않는다
  canvas.style.pointerEvents = on ? 'none' : '';
}

/* ───────── 8. 누르기 · 끌기 ───────── */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const touches = new Map();
let downAt = null, dragged = false, pinch = 0;
function tap(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  // 벽 뒤에서 볼 때 비쳐 보이지 않는 문은 누를 수 없다
  const h = ray.intersectObjects(clickables, false).find(x => x.object.userData.kind !== 'door' || sideWalls.back.visible);
  if (!h) return;
  const kind = h.object.userData.kind, q = h.point;
  if (kind === 'screen') return setBig(true);
  if (kind === 'door') return goTo(0, ZB - 0.8, leave);
  if (kind === 'desk') return goSit(q.x, q.z);
  if (player.seat) standUp();
  goTo(q.x, q.z);
}
function bindInput() {
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    downAt = [e.clientX, e.clientY]; dragged = false;
    if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); }
  });
  canvas.addEventListener('pointermove', e => {
    const was = touches.get(e.pointerId);
    if (!was) return;
    if (touches.size === 2) {
      touches.set(e.pointerId, [e.clientX, e.clientY]);
      const [a, b] = [...touches.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      cam.dist = THREE.MathUtils.clamp(cam.dist - (d - pinch) * 0.02, 2, 10); pinch = d; dragged = true;
      return;
    }
    const dx = e.clientX - was[0], dy = e.clientY - was[1];
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 8) { dragged = true; hideHint(); }
    if (dragged) {
      cam.yaw -= dx * 0.0055;
      cam.pitch = THREE.MathUtils.clamp(cam.pitch + dy * 0.0042, 0.02, 1.15);
    }
  });
  const up = e => {
    const had = touches.delete(e.pointerId);
    if (had && !dragged && touches.size === 0 && e.type === 'pointerup') tap(e);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cam.dist = THREE.MathUtils.clamp(cam.dist * (e.deltaY > 0 ? 1.1 : 0.9), 2, 10);
  }, { passive: false });

  addEventListener('keydown', e => {
    if (!running || e.target.tagName === 'INPUT') return;
    if (e.code === 'Escape') { if (big) setBig(false); else closeLink(); return; }
    if (/^(Arrow|Key[WASD])/.test(e.code)) { keys.add(e.code); e.preventDefault(); }
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
  addEventListener('resize', resize);

  $('roomExit').onclick = leave;
  $('roomPlay').onclick = togglePlay;
  $('roomBig').onclick = () => setBig(!big);
  $('roomSit').onclick = () => {
    if (player.seat) return standUp();
    goSit(player.root.position.x, player.root.position.z);
  };
  $('roomWave').onclick = () => { player.wave = 1.8; };
  $('roomHand').onclick = () => {
    player.hand = !player.hand;
    $('roomHand').classList.toggle('on', player.hand);
  };
  $('roomLink').onclick = () => {
    const box = $('roomLinkBox');
    box.hidden = !box.hidden;
    $('roomLinkMsg').textContent = '';
    if (!box.hidden) $('roomLinkInput').focus();
  };
  $('roomLinkGo').onclick = applyLink;
  $('roomLinkInput').onkeydown = e => { if (e.key === 'Enter') applyLink(); };
  $('roomLinkReset').onclick = () => {
    safeSet(VIDEO_KEY, null);
    video = DEFAULT_VIDEO;
    if (ytReady) yt.cueVideoById(video.id);
    closeLink();
  };
}
function closeLink() { $('roomLinkBox').hidden = true; }
function applyLink() {
  const id = parseYouTube($('roomLinkInput').value);
  if (!id) { $('roomLinkMsg').textContent = '유튜브 주소를 찾지 못했어요. 주소를 다시 붙여 넣어 주세요.'; return; }
  safeSet(VIDEO_KEY, id);
  video = { id, title: '넣어 둔 영상' };
  setStatus('');
  if (ytReady) yt.loadVideoById(id);
  $('roomLinkInput').value = '';
  closeLink();
}

/* ───────── 9. 시작 · 나가기 ───────── */
function resize() {
  if (!running) return;
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  css.setSize(w, h);
  camera.aspect = w / h;
  camera.fov = w < h ? 62 : 50;
  camera.updateProjectionMatrix();
}
function build() {
  canvas = $('roomCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;   // 가구는 움직이지 않으니 그림자는 처음 한 번만 그린다
  renderer.shadowMap.needsUpdate = true;

  css = new CSS3DRenderer({ element: $('roomCss') });
  scene = new THREE.Scene();
  world = new THREE.Group(); scene.add(world);
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  buildRoom();
  buildPeople();
  buildScreen();
  bindInput();
}
let last = 0;
function loop(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  const T = now / 1000;
  stepPlayer(dt);
  stepOthers(dt, T);
  animate(player, dt, T);
  stepCamera(dt);
  if ((clock.t -= dt) <= 0) { clock.t = 20; drawClock(); }
  renderer.render(scene, camera);
  css.render(scene, camera);
  requestAnimationFrame(loop);
}
export function openClassroom(exit) {
  onExit = exit;
  const el = $('room');
  el.classList.add('open', 'fading');
  el.setAttribute('aria-hidden', 'false');
  document.documentElement.classList.add('in-room');
  running = true;
  if (!built) { build(); built = true; }
  resize();
  last = performance.now();
  requestAnimationFrame(loop);
  setTimeout(() => el.classList.remove('fading'), 350);
  setTimeout(hideHint, 7000);
}
function leave() {
  if (!running) return;
  if (big) setBig(false);
  if (ytReady) yt.pauseVideo();
  keys.clear();
  path = []; arrive = null;
  if (player.seat) standUp();
  player.root.position.set(0, 0, 7.6);
  player.root.rotation.y = Math.PI;
  cam.yaw = 0; cam.pitch = 0.34; cam.dist = 5.6;
  running = false;
  const el = $('room');
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  document.documentElement.classList.remove('in-room');
  onExit?.();
}
