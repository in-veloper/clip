import { requireNativeModule } from 'expo-modules-core';

// 페이지 사진 여러 장을 공유 창(카톡 등)으로 넘기는 네이티브 모듈.
// 네이티브가 없는 환경(웹 미리보기 등)에서는 null 이 된다.
let module_ = null;
try {
  module_ = requireNativeModule('ShareImages');
} catch {
  module_ = null;
}

export default module_;
