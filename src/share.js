import ShareImages from '../modules/share-images';
import { pageUri } from './files';
import { toast } from './ui';

// 페이지들을 사진 그대로 공유 창으로 넘긴다. 카톡에서 "나와의 채팅"을 고르면
// 다른 PC 의 카톡에서 바로 열어 볼 수 있다.
export async function sharePages(pages, title) {
  const uris = pages.map((p) => pageUri(p.file)).filter(Boolean);
  if (!uris.length) return false;
  if (!ShareImages) {
    toast('이 환경에서는 공유할 수 없어요', 'error');
    return false;
  }
  try {
    await ShareImages.share(uris, title || '공유');
    return true;
  } catch (e) {
    toast('공유 창을 열지 못했어요', 'error');
    return false;
  }
}
