import React, { useMemo, useRef, useState } from 'react';
import { View, Text } from 'react-native';

import { useStore, reorderPages, itemTitle } from '../store';
import { colors, font, themedStyles } from '../theme';
import { Header, Icon, Button, Empty, toast } from '../ui';
import { Thumb } from '../components/common';
import DragList from '../components/DragList';

export default function ReorderScreen({ route, nav }) {
  const state = useStore();
  const item = state.items.find((it) => it.id === route.id);

  // 화면을 연 시점의 순서를 고정해서 쓰고, 완료를 눌렀을 때 한 번에 저장한다.
  const initial = useMemo(() => (item ? item.pages : []), []);
  const orderRef = useRef(null);
  const [changed, setChanged] = useState(false);

  if (!item || initial.length === 0) {
    return (
      <View style={styles.fill}>
        <Header title="" onBack={nav.pop} />
        <Empty title="자료를 찾을 수 없어요" />
      </View>
    );
  }

  const onDrop = (ordered) => {
    orderRef.current = ordered;
    setChanged(ordered.some((id, i) => id !== initial[i].id));
  };

  const done = () => {
    if (orderRef.current) reorderPages(item.id, orderRef.current);
    toast('순서를 저장했어요');
    nav.pop();
  };

  return (
    <View style={styles.fill}>
      <Header title="순서 변경" subtitle={itemTitle(item)} onBack={nav.pop} />
      <Text style={styles.hint}>페이지를 길게 눌러 위아래로 끌어서 옮기세요.</Text>

      <DragList
        items={initial}
        onDrop={onDrop}
        renderRow={(p, slot) => (
          <>
            <Text style={styles.slot}>{slot + 1}</Text>
            <Thumb file={p.file} style={styles.thumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{slot + 1}쪽</Text>
              {p.fav ? <Text style={styles.favTag}>즐겨찾기</Text> : null}
            </View>
            <Icon name="grip" size={22} color={colors.inkFaint} />
          </>
        )}
      />

      <View style={styles.footer}>
        <Button title="완료" onPress={done} disabled={!changed} />
      </View>
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  hint: { fontFamily: font.regular, fontSize: 13, color: colors.inkFaint, paddingHorizontal: 20, paddingBottom: 10 },
  slot: { width: 22, fontFamily: font.bold, fontSize: 15, color: colors.inkFaint, textAlign: 'center' },
  thumb: { width: 38, height: 52, borderRadius: 6 },
  label: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  favTag: { fontFamily: font.semibold, fontSize: 12, color: colors.star, marginTop: 2 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
}));
