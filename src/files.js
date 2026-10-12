import { Platform } from 'react-native';

// 스캔한 페이지 이미지는 앱 전용 폴더(documentDirectory/pages)에 복사해 두고,
// 메타데이터에는 파일 이름만 적는다. 웹 미리보기에서는 data URL 을 그대로 쓴다.
const DIR_NAME = 'pages';
const isNative = Platform.OS !== 'web';
const fs = isNative ? require('expo-file-system') : null;

let counter = 0;
function newName() {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}.jpg`;
}

function pagesDir() {
  const dir = new fs.Directory(fs.Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

const isUri = (s) => /^(data:|blob:|https?:|file:|content:)/.test(s);

export async function importPage(srcUri) {
  if (!isNative) return srcUri;
  const name = newName();
  const source = new fs.File(srcUri);
  await source.copy(new fs.File(pagesDir(), name));
  try {
    source.delete();
  } catch {
    // 스캐너 캐시 정리는 못 해도 괜찮다.
  }
  return name;
}

export function pageUri(file) {
  if (!file) return null;
  if (!isNative || isUri(file)) return file;
  return new fs.File(pagesDir(), file).uri;
}

export function removeFile(file) {
  if (!isNative || !file || isUri(file)) return;
  try {
    const target = new fs.File(pagesDir(), file);
    if (target.exists) target.delete();
  } catch {
    // 이미 없으면 그만이다.
  }
}
