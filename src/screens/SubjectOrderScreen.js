import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

import { useStore, reorderSubjects } from '../store';
import { colors, font, themedStyles } from '../theme';
import { Header, Icon, Button } from '../ui';
import DragList from '../components/DragList';

export default function SubjectOrderScreen({ nav }) {
  const { subjects } = useStore();
  // 열었을 때의 순서로 고정해 두고, 손을 뗄 때마다 바로 저장한다.
  const initial = useMemo(() => subjects, []);

  return (
    <View style={styles.fill}>
      <Header title="과목 순서" onBack={nav.pop} />
      <Text style={styles.hint}>과목을 길게 눌러 위아래로 끌어서 옮기세요. 바로 저장돼요.</Text>

      <DragList
        items={initial}
        rowHeight={74}
        onDrop={reorderSubjects}
        renderRow={(s, slot) => (
          <>
            <Text style={styles.slot}>{slot + 1}</Text>
            <View style={[styles.tile, { backgroundColor: `${s.color}22` }]}>
              <Icon name="folder" size={20} color={s.color} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {s.name}
            </Text>
            <Icon name="grip" size={22} color={colors.inkFaint} />
          </>
        )}
      />

      <View style={styles.footer}>
        <Button title="완료" onPress={nav.pop} />
      </View>
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  hint: { fontFamily: font.regular, fontSize: 13, color: colors.inkFaint, paddingHorizontal: 20, paddingBottom: 10 },
  slot: { width: 20, fontFamily: font.bold, fontSize: 15, color: colors.inkFaint, textAlign: 'center' },
  tile: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  name: { flex: 1, fontFamily: font.bold, fontSize: 16.5, color: colors.ink },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 },
}));
