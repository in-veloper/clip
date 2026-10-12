import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, Image, FlatList, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

import { useStore, favoritesOf, itemTitle, subjectName, toggleFav, setLastView } from '../store';
import { pageUri } from '../files';
import { font } from '../theme';
import { Icon } from '../ui';

const BG = '#0B0C10';
const STAR = '#F5B921';
const MAX_ZOOM = 5;
// 이미지를 화면의 2배 크기로 그려 두고 0.5배로 줄여 보여 줘야, 확대했을 때 글씨가 뭉개지지 않는다.
const BASE = 2;

const clamp = (v, lo, hi) => {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
};

function ZoomPage({ uri, width, height, onZoom, onTap }) {
  const z = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const [zoomed, setZoomed] = useState(false);

  const report = useCallback(
    (v) => {
      setZoomed(v);
      onZoom(v);
    },
    [onZoom]
  );

  const limit = () => {
    'worklet';
    const mx = (width * z.value - width) / 2;
    const my = (height * z.value - height) / 2;
    tx.value = clamp(tx.value, -mx, mx);
    ty.value = clamp(ty.value, -my, my);
  };

  const reset = () => {
    'worklet';
    z.value = withTiming(1, { duration: 200 });
    tx.value = withTiming(0, { duration: 200 });
    ty.value = withTiming(0, { duration: 200 });
    runOnJS(report)(false);
  };

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      const prev = z.value;
      const next = clamp(prev * e.scaleChange, 1, MAX_ZOOM);
      const r = next / prev;
      const fx = e.focalX - width / 2;
      const fy = e.focalY - height / 2;
      tx.value = fx * (1 - r) + r * tx.value;
      ty.value = fy * (1 - r) + r * ty.value;
      z.value = next;
      limit();
      if (next > 1.02) runOnJS(report)(true);
    })
    .onEnd(() => {
      if (z.value < 1.05) reset();
    });

  const pan = Gesture.Pan()
    .enabled(zoomed)
    .minDistance(2)
    .onChange((e) => {
      tx.value += e.changeX;
      ty.value += e.changeY;
      limit();
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (z.value > 1.05) {
        reset();
      } else {
        const next = 2.6;
        const fx = e.x - width / 2;
        const fy = e.y - height / 2;
        const nx = clamp(fx * (1 - next), -(width * next - width) / 2, (width * next - width) / 2);
        const ny = clamp(fy * (1 - next), -(height * next - height) / 2, (height * next - height) / 2);
        z.value = withTiming(next, { duration: 220 });
        tx.value = withTiming(nx, { duration: 220 });
        ty.value = withTiming(ny, { duration: 220 });
        runOnJS(report)(true);
      }
    });

  const singleTap = Gesture.Tap().onEnd(() => runOnJS(onTap)());

  const gesture = Gesture.Simultaneous(Gesture.Exclusive(doubleTap, singleTap), pinch, pan);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: z.value / BASE }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height, overflow: 'hidden' }} collapsable={false}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: -width / 2,
              top: -height / 2,
              width: width * BASE,
              height: height * BASE,
            },
            style,
          ]}
        >
          {uri ? <Image source={{ uri }} resizeMode="contain" style={{ width: '100%', height: '100%' }} /> : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export default function ViewerScreen({ route, nav }) {
  const state = useStore();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // 열 때의 페이지 목록을 고정해 둔다(보는 중에 즐겨찾기를 해제해도 목록이 바뀌지 않게).
  const entries = useMemo(() => {
    if (route.favorites) return favoritesOf(state).map((f) => ({ itemId: f.item.id, pageId: f.page.id }));
    const item = state.items.find((it) => it.id === route.itemId);
    return item ? item.pages.map((p) => ({ itemId: item.id, pageId: p.id })) : [];
  }, []);

  const [index, setIndex] = useState(Math.min(route.index || 0, Math.max(0, entries.length - 1)));
  const [chrome, setChrome] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const listRef = useRef(null);

  const current = entries[index];
  const item = current && state.items.find((it) => it.id === current.itemId);
  const page = item && item.pages.find((p) => p.id === current.pageId);
  const pageNo = item ? item.pages.findIndex((p) => p.id === current.pageId) + 1 : 0;

  const onScrollEnd = (e) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index && entries[next]) {
      setIndex(next);
      setLastView(entries[next].itemId, entries[next].pageId);
    }
  };

  React.useEffect(() => {
    if (entries[index]) setLastView(entries[index].itemId, entries[index].pageId);
  }, []);

  const toggleChrome = useCallback(() => setChrome((c) => !c), []);

  if (!entries.length) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }]}>
        <StatusBar style="light" />
        <Text style={styles.empty}>볼 페이지가 없어요</Text>
        <Pressable onPress={nav.pop} style={styles.emptyBack}>
          <Text style={styles.emptyBackText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={entries}
        keyExtractor={(e) => e.pageId}
        horizontal
        pagingEnabled
        scrollEnabled={!zoomed}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialNumToRender={1}
        windowSize={3}
        maxToRenderPerBatch={1}
        removeClippedSubviews
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item: e }) => {
          const it = state.items.find((x) => x.id === e.itemId);
          const pg = it && it.pages.find((p) => p.id === e.pageId);
          return (
            <ZoomPage uri={pg ? pageUri(pg.file) : null} width={width} height={height} onZoom={setZoomed} onTap={toggleChrome} />
          );
        }}
      />

      {chrome && (
        <>
          <View style={[styles.top, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
            <Pressable onPress={nav.pop} hitSlop={12} style={styles.topBtn}>
              <Icon name="back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.count}>
              {index + 1} / {entries.length}
            </Text>
            <Pressable onPress={() => item && page && toggleFav(item.id, page.id)} hitSlop={12} style={styles.topBtn}>
              <Icon name="star" size={26} color={page && page.fav ? STAR : '#fff'} fill={page && page.fav ? STAR : 'none'} stroke={1.8} />
            </Pressable>
          </View>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 14 }]} pointerEvents="none">
            {item ? (
              <>
                <Text style={styles.title} numberOfLines={1}>
                  {itemTitle(item)} · {pageNo}쪽
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {subjectName(state, item.subjectId)}
                </Text>
              </>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(11,12,16,0.55)',
  },
  topBtn: { width: 44, height: 40, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: font.semibold, fontSize: 15, color: '#fff' },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 16,
    backgroundColor: 'rgba(11,12,16,0.55)',
  },
  title: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
  sub: { fontFamily: font.regular, fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  empty: { fontFamily: font.semibold, fontSize: 16, color: '#fff', marginBottom: 14 },
  emptyBack: { paddingHorizontal: 18, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center' },
  emptyBackText: { fontFamily: font.semibold, fontSize: 14, color: '#fff' },
});
