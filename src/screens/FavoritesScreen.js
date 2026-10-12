import React, { useMemo } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';

import { useStore, favoritesOf, itemTitle, subjectName } from '../store';
import { colors, font, themedStyles } from '../theme';
import { Header, Icon, Empty } from '../ui';
import { Thumb } from '../components/common';

export default function FavoritesScreen({ nav }) {
  const state = useStore();
  const favs = useMemo(() => favoritesOf(state), [state]);

  return (
    <View style={styles.fill}>
      <Header title="즐겨찾기" subtitle={`${favs.length}페이지`} onBack={nav.pop} />

      {favs.length === 0 ? (
        <Empty
          title="즐겨찾기한 페이지가 없어요"
          sub={'다시 봐야 할 페이지를 열어서 별표를 눌러 두면\n여기에 모여요.'}
        />
      ) : (
        <FlatList
          data={favs}
          keyExtractor={(f) => f.page.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: f, index }) => (
            <Pressable style={styles.cell} onPress={() => nav.push('viewer', { favorites: true, index })}>
              <View>
                <Thumb file={f.page.file} style={styles.thumb} />
                <View style={styles.star}>
                  <Icon name="star" size={13} color={colors.star} fill={colors.star} stroke={1.5} />
                </View>
              </View>
              <Text style={styles.caption} numberOfLines={1}>
                {subjectName(state, f.item.subjectId)}
              </Text>
              <Text style={styles.sub} numberOfLines={1}>
                {itemTitle(f.item)} · {f.index + 1}쪽
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  grid: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 6 },
  row: { gap: 10, marginBottom: 12 },
  cell: { flex: 1, maxWidth: '32%' },
  thumb: { width: '100%', aspectRatio: 0.75, borderRadius: 10 },
  star: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(15,18,24,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: { fontFamily: font.semibold, fontSize: 12.5, color: colors.ink, marginTop: 6 },
  sub: { fontFamily: font.regular, fontSize: 11.5, color: colors.inkFaint, marginTop: 1 },
}));
