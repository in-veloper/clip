import { Platform } from 'react-native';

import { importPage } from './files';

const MAX_PAGES = 40;

// 웹 미리보기에서 화면을 시험할 수 있게 가짜 책 페이지를 그려 낸다(폰에서는 쓰이지 않는다).
function fakePage(n, tag) {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 820;
  const g = c.getContext('2d');
  g.fillStyle = '#FBFAF6';
  g.fillRect(0, 0, 600, 820);
  g.fillStyle = '#222';
  g.font = 'bold 30px sans-serif';
  g.fillText(`${tag} · ${n}쪽`, 50, 80);
  g.fillStyle = '#666';
  for (let i = 0; i < 24; i++) {
    const w = 380 + ((i * 53) % 170);
    g.fillRect(50, 130 + i * 28, w, 9);
  }
  g.fillStyle = '#999';
  g.font = '20px sans-serif';
  g.fillText(String(n), 290, 790);
  return c.toDataURL('image/jpeg', 0.7);
}

// 반환: 저장된 파일 이름 배열(취소하면 빈 배열)
export async function scanPages({ tag = '샘플' } = {}) {
  if (Platform.OS === 'web') {
    // 브라우저 시험용: 실제 사진을 스캔 결과처럼 넘겨 볼 수 있다.
    if (window.__clipScanImages && window.__clipScanImages.length) return window.__clipScanImages;
    return [fakePage(1, tag), fakePage(2, tag), fakePage(3, tag)];
  }

  // 웹에서는 이 모듈을 불러오는 것만으로 에러가 나서, 폰에서만 늦게 불러온다.
  const DocumentScanner = require('react-native-document-scanner-plugin').default;
  const result = await DocumentScanner.scanDocument({ maxNumDocuments: MAX_PAGES });
  if (result.status !== 'success' || !result.scannedImages || !result.scannedImages.length) return [];

  const files = [];
  for (const uri of result.scannedImages) {
    files.push(await importPage(uri));
  }
  return files;
}
