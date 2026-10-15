import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

// 책을 책상에 두고 폰을 바닥과 수평으로 들고 찍으면, 기울기 센서가 위아래를 헷갈려
// 스캐너가 사진을 180도 뒤집어 저장할 때가 있다. 작게 줄인 사진을 그대로/뒤집어서 두 번
// 글자 인식을 돌려 보고, 뒤집은 쪽에서 글자가 훨씬 많이 읽히면 원본을 뒤집어 저장한다.
const CHECK_WIDTH = 900;
const MIN_CHARS = 20; // 글자가 거의 없는 사진(그림 등)은 판단하지 않는다
const MARGIN = 1.6; // 뒤집은 쪽이 이만큼은 더 읽혀야 뒤집는다(애매하면 그대로 둔다)

async function render(uri, { width, rotate, compress = 0.8 }) {
  const ctx = ImageManipulator.manipulate(uri);
  if (width) ctx.resize({ width });
  if (rotate) ctx.rotate(rotate);
  const image = await ctx.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress });
  return saved.uri;
}

// 제대로 읽힌 글자 수(한글·영문·숫자). 뒤집힌 글은 인식이 거의 안 되거나 엉터리 몇 글자뿐이다.
async function readableChars(uri) {
  const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN);
  const text = result && result.text ? result.text : '';
  return (text.match(/[가-힣A-Za-z0-9]/g) || []).length;
}

// 바로 선 사진의 주소를 돌려준다(뒤집을 필요가 없으면 받은 그대로).
export async function uprightPage(uri) {
  try {
    const small = await render(uri, { width: CHECK_WIDTH });
    const flipped = await render(small, { rotate: 180 });
    const [up, down] = await Promise.all([readableChars(small), readableChars(flipped)]);
    if (down >= MIN_CHARS && down > up * MARGIN) {
      return await render(uri, { rotate: 180, compress: 0.92 });
    }
  } catch {
    // 판단에 실패하면 원본 그대로 둔다.
  }
  return uri;
}
