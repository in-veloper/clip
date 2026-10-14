import { StyleSheet } from 'react-native';

export const palettes = {
  light: {
    bg: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F3',
    ink: '#161A22',
    onInk: '#FFFFFF',
    inkSoft: '#5B6271',
    inkFaint: '#9AA1AE',
    line: '#E4E7EC',
    frame: '#D2D7DF', // 페이지 썸네일 테두리 — 흰 종이와 바탕을 갈라 줄 만큼만 진하게
    accent: '#3B5BFD',
    accentSoft: '#E8EDFF',
    star: '#F2A900',
    bad: '#E5534B',
    scrim: 'rgba(15, 18, 24, 0.45)',
  },
  dark: {
    bg: '#0E1014',
    surface: '#181B21',
    surfaceAlt: '#22262E',
    ink: '#ECEEF2',
    onInk: '#0E1014',
    inkSoft: '#A5ABB8',
    inkFaint: '#6C7381',
    line: '#2A2F38',
    frame: '#363C47',
    accent: '#6C86FF',
    accentSoft: '#1D2442',
    star: '#F5B921',
    bad: '#F06A62',
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
};

export const colors = { ...palettes.light };

let mode = 'light';
let version = 0;

export function applyTheme(next) {
  if (next === mode || !palettes[next]) return;
  mode = next;
  Object.assign(colors, palettes[next]);
  version += 1;
}

// 테마별 StyleSheet 를 필요할 때 만들어 두고, 접근할 때 현재 테마 것을 돌려준다.
export function themedStyles(factory) {
  let cache = null;
  let ver = -1;
  const resolve = () => {
    if (ver !== version) {
      cache = StyleSheet.create(factory());
      ver = version;
    }
    return cache;
  };
  return new Proxy({}, { get: (_, key) => resolve()[key] });
}

export const font = {
  regular: 'Pretendard-Regular',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

// 과목 색. 가장 가까운 두 색의 차이(CIE Lab)가 30 이상이라 눈으로 쉽게 구분되는 12색이다.
export const SUBJECT_COLORS = [
  '#3B5BFD', // 파랑
  '#E8833A', // 주황
  '#2FB574', // 초록
  '#E0457B', // 분홍
  '#B14FE0', // 보라
  '#F2A900', // 노랑
  '#13A3B5', // 청록
  '#E5534B', // 빨강
  '#8BB918', // 연두
  '#3BA7F5', // 하늘
  '#A9774E', // 갈색
  '#64748B', // 회청
];

export const shadow = {
  shadowColor: '#0B0E14',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
