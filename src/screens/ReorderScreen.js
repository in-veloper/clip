import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useAnimatedRef,
  useScrollOffset,
  scrollTo,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { useStore, reorderPages, itemTitle } from '../store';
import { colors, font, themedStyles } from '../theme';
import { Header, Icon, Button, Empty, toast } from '../ui';
import { Thumb } from '../components/common';

const ROW = 78;
const EDGE = 110;

function Row({ page, index, count, positions, scrollRef, scrollY, winH, onEnd }) {
  const y = useSharedValue(index * ROW);
  const dragging = useSharedValue(false);
  const startY = useSharedValue(0);
  const startScroll = useSharedValue(0);
  const [slot, setSlot] = useState(index);

  useAnimatedReaction(
    () => positions.value[index],
    (cur, prev) => {
      if (cur !== prev) runOnJS(setSlot)(cur);
      if (!dragging.value && cur !== prev) y.value = withTiming(cur * ROW, { duration: 160 });
    }
  );

  const pan = Gesture.Pan()
    .activateAfterLongPress(170)
    .onStart(() => {
      dragging.value = true;
      startY.value = y.value;
      startScroll.value = scrollY.value;
    })
    .onUpdate((e) => {
      // 목록 끝 근처로 끌면 스크롤을 조금씩 밀어 준다.
      if (e.absoluteY > winH - EDGE) scrollTo(scrollRef, 0, scrollY.value + 14, false);
      else if (e.absoluteY < EDGE + 120) scrollTo(scrollRef, 0, Math.max(0, scrollY.value - 14), false);

      const raw = startY.value + e.translationY + (scrollY.value - startScroll.value);
      y.value = Math.min(Math.max(raw, 0), (count - 1) * ROW);

      const target = Math.min(count - 1, Math.max(0, Math.round(y.value / ROW)));
      const cur = positions.value[index];
      if (target !== cur) {
        const next = positions.value.slice();
        for (let k = 0; k < next.length; k++) {
          if (k === index) continue;
          const p = next[k];
          if (cur < target && p > cur && p <= target) next[k] = p - 1;
          else if (cur > target && p < cur && p >= target) next[k] = p + 1;
        }
        next[index] = target;
        positions.value = next;
      }
    })
    .onFinalize(() => {
      if (dragging.value) {
        dragging.value = false;
        y.value = withTiming(positions.value[index] * ROW, { duration: 140 });
        runOnJS(onEnd)();
      }
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { scale: dragging.value ? 1.02 : 1 }],
    zIndex: dragging.value ? 20 : 0,
    shadowOpacity: dragging.value ? 0.18 : 0,
    elevation: dragging.value ? 10 : 0,
  }));

  return (
    <Animated.View style={[styles.row, style]}>
      <GestureDetector gesture={pan}>
        <View style={styles.rowInner} collapsable={false}>
          <Text style={styles.slot}>{slot + 1}</Text>
          <Thumb file={page.file} style={styles.thumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{slot + 1}쪽</Text>
            {page.fav ? <Text style={styles.favTag}>즐겨찾기</Text> : null}
          </View>
          <Icon name="grip" size={22} color={colors.inkFaint} />
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

export default function ReorderScreen({ route, nav }) {
  const state = useStore();
  const { height: winH } = useWindowDimensions();
  const item = state.items.find((it) => it.id === route.id);

  // 화면을 연 시점의 순서를 고정해서 쓰고, 완료를 눌렀을 때 한 번에 저장한다.
  const initial = useMemo(() => (item ? item.pages : []), []);
  const positions = useSharedValue(initial.map((_, i) => i));
  const [changed, setChanged] = useState(false);

  const scrollRef = useAnimatedRef();
  const scrollY = useScrollOffset(scrollRef);

  const onEnd = useCallback(() => {
    const slots = positions.value;
    setChanged(slots.some((s, i) => s !== i));
  }, [positions]);

  if (!item || initial.length === 0) {
    return (
      <View style={styles.fill}>
        <Header title="" onBack={nav.pop} />
        <Empty title="자료를 찾을 수 없어요" />
      </View>
    );
  }

  const done = () => {
    const slots = positions.value;
    const ordered = new Array(initial.length);
    initial.forEach((p, i) => {
      ordered[slots[i]] = p.id;
    });
    reorderPages(item.id, ordered);
    toast('순서를 저장했어요');
    nav.pop();
  };

  return (
    <View style={styles.fill}>
      <Header title="순서 변경" subtitle={itemTitle(item)} onBack={nav.pop} />
      <Text style={styles.hint}>페이지를 길게 눌러 위아래로 끌어서 옮기세요.</Text>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={{ height: initial.length * ROW + 16, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {initial.map((p, i) => (
          <Row
            key={p.id}
            page={p}
            index={i}
            count={initial.length}
            positions={positions}
            scrollRef={scrollRef}
            scrollY={scrollY}
            winH={winH}
            onEnd={onEnd}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <Button title="완료" onPress={done} disabled={!changed} />
      </View>
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  hint: { fontFamily: font.regular, fontSize: 13, color: colors.inkFaint, paddingHorizontal: 20, paddingBottom: 10 },
  row: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    height: ROW - 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  rowInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14 },
  slot: { width: 22, fontFamily: font.bold, fontSize: 15, color: colors.inkFaint, textAlign: 'center' },
  thumb: { width: 38, height: 52, borderRadius: 6 },
  label: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  favTag: { fontFamily: font.semibold, fontSize: 12, color: colors.star, marginTop: 2 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
}));
