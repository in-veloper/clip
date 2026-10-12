import React, { useCallback, useEffect, useState } from 'react';
import { View, BackHandler, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';

import { init, useStore } from './src/store';
import { colors, font, themedStyles, applyTheme } from './src/theme';
import { ToastHost, ConfirmHost } from './src/ui';
import HomeScreen from './src/screens/HomeScreen';
import SubjectScreen from './src/screens/SubjectScreen';
import ItemScreen from './src/screens/ItemScreen';
import ViewerScreen from './src/screens/ViewerScreen';
import ReorderScreen from './src/screens/ReorderScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';

let routeSeq = 0;
const mk = (name, params) => ({ name, ...params, _k: ++routeSeq });

const SCREENS = {
  home: HomeScreen,
  subject: SubjectScreen,
  item: ItemScreen,
  viewer: ViewerScreen,
  reorder: ReorderScreen,
  favorites: FavoritesScreen,
};

function Root() {
  const insets = useSafeAreaInsets();
  const state = useStore();
  const [stack, setStack] = useState(() => [mk('home', {})]);

  const nav = {
    push: useCallback((name, params = {}) => setStack((s) => [...s, mk(name, params)]), []),
    pop: useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []),
    replace: useCallback((name, params = {}) => setStack((s) => [...s.slice(0, -1), mk(name, params)]), []),
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        nav.pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length]);

  if (!state.loaded) return <View style={styles.fill} />;

  const route = stack[stack.length - 1];
  const Screen = SCREENS[route.name];
  const full = route.name === 'viewer';

  return (
    <View style={[styles.fill, !full && { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Screen key={`${route._k}-${state.theme}`} route={route} nav={nav} />
      <ToastHost />
      <ConfirmHost />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    [font.regular]: require('./assets/fonts/Pretendard-Regular.ttf'),
    [font.semibold]: require('./assets/fonts/Pretendard-SemiBold.ttf'),
    [font.bold]: require('./assets/fonts/Pretendard-Bold.ttf'),
  });

  const { theme } = useStore();
  // 자식들이 그리기 전에 색을 먼저 바꿔 둔다.
  applyTheme(theme);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [theme]);

  return (
    <GestureHandlerRootView key={theme} style={styles.fill}>
      <SafeAreaProvider>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        {fontsLoaded ? <Root /> : <View style={styles.fill} />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1, backgroundColor: colors.bg },
}));
