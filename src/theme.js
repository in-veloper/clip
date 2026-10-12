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

export const SUBJECT_COLORS = [
  '#3B5BFD', '#16A085', '#E07A3F', '#9B5DE5', '#E0457B', '#13A3B5', '#C9A227', '#5E6AD2',
];

export const shadow = {
  shadowColor: '#0B0E14',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
};
