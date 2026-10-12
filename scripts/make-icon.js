// 받은 아이콘(남색 둥근 사각형 + 쌓인 페이지)에서 남색 바탕을 투명으로 분리해 아트워크만 뽑고,
// 안드로이드 적응형 아이콘 안전영역(지름 66/108) 안에 중앙 배치한다.
// 바탕이 단색이라, 픽셀마다 "남색 위에 얹은 색 + 투명도"로 분해하면 가장자리 안티앨리어싱까지
// 깨끗하게 남고(사각형 경계/잔여 테두리 없음), 남색 위에 다시 얹으면 원본과 똑같이 보인다.
// 사용: node scripts/make-icon.js <원본 이미지 경로>
const path = require('path');
const sharp = require('C:/ClaudeCode_Project/studyplan/node_modules/sharp');

const SRC = process.argv[2];
const ASSETS = path.join(__dirname, '..', 'assets');
const BG = [8, 16, 41]; // #081029
const BG_HEX = '#081029';

// 원본 기준 아트워크 범위(1254x1254)에 여유를 둔 영역. 둥근 모서리 바깥(흰색)은 포함하지 않는다.
const CROP = { left: 205, top: 213, width: 842, height: 819 };
const SAFE_RADIUS = 226; // 1024 캔버스 기준. 적응형 아이콘 안전영역(313)에 여유를 크게 두고 그림을 작게

async function loadArt() {
  const { data, info } = await sharp(SRC).extract(CROP).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const rgba = Buffer.alloc(w * h * 4);
  const mono = Buffer.alloc(w * h * 4);

  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const o = (y * w + x) * 4;
      let a = 0;
      for (let c = 0; c < 3; c++) a = Math.max(a, (data[i + c] - BG[c]) / (255 - BG[c]));
      a = Math.max(0, Math.min(1, a));
      if (a < 0.05) a = 0; // 압축 노이즈 제거

      if (a > 0) {
        for (let c = 0; c < 3; c++) {
          const v = (data[i + c] - BG[c] * (1 - a)) / a;
          rgba[o + c] = Math.max(0, Math.min(255, Math.round(v)));
        }
      }
      rgba[o + 3] = Math.round(a * 255);

      const m = Math.max(0, Math.min(1, (a - 0.25) / 0.35));
      mono[o] = mono[o + 1] = mono[o + 2] = 255;
      mono[o + 3] = Math.round(m * 255);

      if (a > 0.5) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  let radius = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 80) radius = Math.max(radius, Math.hypot(x - cx, y - cy));
    }
  }
  return { rgba, mono, w, h, cx, cy, radius, box: { minX, minY, maxX, maxY } };
}

// 아트워크 중심이 캔버스 한가운데 오도록, 주어진 배율로 놓는다.
async function place(buf, art, scale, size, background) {
  const w = Math.round(art.w * scale);
  const h = Math.round(art.h * scale);
  const layer = await sharp(buf, { raw: { width: art.w, height: art.h, channels: 4 } })
    .resize(w, h, { kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const left = Math.round(size / 2 - art.cx * scale);
  const top = Math.round(size / 2 - art.cy * scale);
  const base = sharp({ create: { width: size, height: size, channels: 4, background } });
  // 캔버스 밖으로 나가는 부분(투명 여백)은 잘라서 합성한다.
  const L = Math.max(0, -left);
  const T = Math.max(0, -top);
  const cropped = await sharp(layer)
    .extract({ left: L, top: T, width: Math.min(w - L, size - Math.max(0, left)), height: Math.min(h - T, size - Math.max(0, top)) })
    .png()
    .toBuffer();
  return base.composite([{ input: cropped, left: Math.max(0, left), top: Math.max(0, top) }]).png();
}

(async () => {
  const art = await loadArt();
  const clear = { r: 0, g: 0, b: 0, alpha: 0 };
  const solid = { r: BG[0], g: BG[1], b: BG[2], alpha: 1 };

  // 적응형 아이콘: 아트워크의 가장 먼 점이 안전 반지름 안에 들어오도록
  const sAdaptive = SAFE_RADIUS / art.radius;
  (await place(art.rgba, art, sAdaptive, 1024, clear)).toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  (await place(art.mono, art, sAdaptive, 1024, clear)).toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: solid } }).png().toFile(path.join(ASSETS, 'android-icon-background.png'));

  // 일반 아이콘(둥근 마스크 없이 쓰이는 곳): 남색 꽉 찬 사각형에 폭의 약 62%
  const sFull = 540 / (art.box.maxX - art.box.minX);
  const full = await place(art.rgba, art, sFull, 1024, solid);
  await full.toFile(path.join(ASSETS, 'icon.png'));
  await sharp(path.join(ASSETS, 'icon.png')).resize(196).png().toFile(path.join(ASSETS, 'favicon.png'));

  // 스플래시: 남색 배경색 위에 아트워크만
  const sSplash = 560 / (art.box.maxX - art.box.minX);
  (await place(art.rgba, art, sSplash, 1024, clear)).toFile(path.join(ASSETS, 'splash-icon.png'));

  console.log(
    JSON.stringify({
      box: art.box,
      center: [art.cx, art.cy],
      radius: Math.round(art.radius),
      adaptiveScale: +sAdaptive.toFixed(3),
      adaptiveSize: [Math.round((art.box.maxX - art.box.minX) * sAdaptive), Math.round((art.box.maxY - art.box.minY) * sAdaptive)],
    })
  );
})();
