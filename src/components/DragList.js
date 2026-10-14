import React, { useCallback, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
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

import { colors, themedStyles } from '../theme';

const EDGE = 110;

// 줄 하나. 길게 눌렀다가 위아래로 끌면 그 줄이 따라오고, 다른 줄들은 자리를 비켜 준다.
function DragRow({ index, count, rowHeight, positions, scrollRef, scrollY, winH, onEnd, children }) {
  const y = useSharedValue(index * rowHeight);
  const dragging = useSharedValue(false);
  const startY = useSharedValue(0);
  const startScroll = useSharedValue(0);
  const [slot, setSlot] = useState(index);

  useAnimatedReaction(
    () => positions.value[index],
    (cur, prev) => {
      if (cur !== prev) runOnJS(setSlot)(cur);
      if (!dragging.value && cur !== prev) y.value = withTiming(cur * rowHeight, { duration: 160 });
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
      // 목록 위·아래 끝 근처로 끌면 스크롤을 조금씩 밀어 준다.
      if (e.absoluteY > winH - EDGE) scrollTo(scrollRef, 0, scrollY.value + 14, false);
      else if (e.absoluteY < EDGE + 120) scrollTo(scrollRef, 0, Math.max(0, scrollY.value - 14), false);

      const raw = startY.value + e.translationY + (scrollY.value - startScroll.value);
      y.value = Math.min(Math.max(raw, 0), (count - 1) * rowHeight);

      const target = Math.min(count - 1, Math.max(0, Math.round(y.value / rowHeight)));
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
        y.value = withTiming(positions.value[index] * rowHeight, { duration: 140 });
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
    <Animated.View style={[styles.row, { height: rowHeight - 8 }, style]}>
      <GestureDetector gesture={pan}>
        <View style={styles.rowInner} collapsable={false}>
          {children(slot)}
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

// items: [{ id, ... }]  — 열었을 때의 순서로 고정해서 쓴다(저장해도 줄이 다시 섞이지 않게).
// renderRow(item, slot): 줄 안쪽 내용(slot 은 지금 위치, 0부터)
// onDrop(orderedIds): 손을 뗄 때마다 현재 순서를 알려 준다
export default function DragList({ items, rowHeight = 78, renderRow, onDrop }) {
  const { height: winH } = useWindowDimensions();
  const positions = useSharedValue(items.map((_, i) => i));
  const scrollRef = useAnimatedRef();
  const scrollY = useScrollOffset(scrollRef);

  const handleEnd = useCallback(() => {
    const slots = positions.value;
    const ordered = new Array(items.length);
    items.forEach((it, i) => {
      ordered[slots[i]] = it.id;
    });
    onDrop(ordered);
  }, [items, onDrop, positions]);

  return (
    <Animated.ScrollView
      ref={scrollRef}
      contentContainerStyle={{ height: items.length * rowHeight + 16 }}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
    >
      {items.map((it, i) => (
        <DragRow
          key={it.id}
          index={i}
          count={items.length}
          rowHeight={rowHeight}
          positions={positions}
          scrollRef={scrollRef}
          scrollY={scrollY}
          winH={winH}
          onEnd={handleEnd}
        >
          {(slot) => renderRow(it, slot)}
        </DragRow>
      ))}
    </Animated.ScrollView>
  );
}

const styles = themedStyles(() => ({
  row: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  rowInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14 },
}));
