import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';

import {
  useStore,
  itemsOf,
  itemTitle,
  createItem,
  moveItem,
  renameItem,
  deleteItem,
  INBOX,
} from '../store';
import { scanPages } from '../scan';
import { colors, font, themedStyles } from '../theme';
import { Header, IconButton, Icon, Sheet, SheetItem, Empty, toast, confirmDialog } from '../ui';
import { Thumb, NameSheet, PickSheet } from '../components/common';

function fmtDate(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function ItemCard({ item, inbox, onPress, onLongPress, onClassify }) {
  const hasFav = item.pages.some((p) => p.fav);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.itemCard, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View>
        <Thumb file={item.pages[0].file} style={styles.itemCover} />
        <View style={styles.countPill}>
          <Icon name="pages" size={12} color="#fff" stroke={2.2} />
          <Text style={styles.countText}>{item.pages.length}</Text>
        </View>
        {hasFav ? (
          <View style={styles.favBadge}>
            <Icon name="star" size={14} color={colors.star} fill={colors.star} stroke={1.5} />
          </View>
        ) : null}
      </View>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {itemTitle(item)}
      </Text>
      <View style={styles.itemFoot}>
        <Text style={styles.itemDate}>{fmtDate(item.createdAt)}</Text>
        {inbox ? (
          <Pressable onPress={onClassify} hitSlop={8} style={styles.classify}>
            <Text style={styles.classifyText}>분류</Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SubjectScreen({ route, nav }) {
  const state = useStore();
  const subjectId = route.id;
  const inbox = subjectId === INBOX;
  const subject = inbox ? null : state.subjects.find((s) => s.id === subjectId);
  const items = useMemo(() => itemsOf(state, subjectId), [state, subjectId]);

  const [menuFor, setMenuFor] = useState(null);
  const [moving, setMoving] = useState(null);
  const [renaming, setRenaming] = useState(null);

  if (!inbox && !subject) {
    return (
      <View style={styles.fill}>
        <Header title="" onBack={nav.pop} />
        <Empty title="과목을 찾을 수 없어요" />
      </View>
    );
  }

  const pages = items.reduce((n, it) => n + it.pages.length, 0);

  const scan = async () => {
    try {
      const files = await scanPages({ tag: inbox ? '임시' : subject.name });
      if (!files.length) return;
      createItem({ subjectId: inbox ? null : subjectId, files });
      toast(`${files.length}장 저장했어요`);
    } catch (e) {
      toast('스캔을 시작하지 못했어요', 'error');
    }
  };

  const confirmDelete = (item) => {
    setMenuFor(null);
    confirmDialog({
      title: '자료를 삭제할까요?',
      message: `"${itemTitle(item)}"\n${item.pages.length}페이지가 함께 지워져요.`,
      confirmLabel: '삭제',
      onConfirm: () => deleteItem(item.id),
    });
  };

  return (
    <View style={styles.fill}>
      <Header
        title={inbox ? '임시 보관함' : subject.name}
        subtitle={`자료 ${items.length} · 페이지 ${pages}`}
        onBack={nav.pop}
        right={<IconButton name="scan" color={colors.accent} onPress={scan} />}
      />

      {items.length === 0 ? (
        <Empty
          title={inbox ? '임시 보관함이 비어 있어요' : '아직 자료가 없어요'}
          sub={inbox ? '분류를 나중에 하고 싶을 때 여기에 저장해 두세요.' : '오른쪽 위 스캔 버튼으로 책 페이지를 찍어 보세요.'}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              inbox={inbox}
              onPress={() => nav.push('item', { id: item.id })}
              onLongPress={() => setMenuFor(item)}
              onClassify={() => setMoving(item)}
            />
          )}
        />
      )}

      <Sheet visible={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor ? itemTitle(menuFor) : ''}>
        <SheetItem
          icon="edit"
          label="이름 변경"
          onPress={() => {
            const it = menuFor;
            setMenuFor(null);
            setRenaming(it);
          }}
        />
        <SheetItem
          icon="move"
          label="과목 이동"
          onPress={() => {
            const it = menuFor;
            setMenuFor(null);
            setMoving(it);
          }}
        />
        <SheetItem icon="trash" label="자료 삭제" danger onPress={() => confirmDelete(menuFor)} />
      </Sheet>

      <PickSheet
        visible={!!moving}
        title="어느 과목으로 옮길까요?"
        subjects={state.subjects}
        selectedId={moving ? moving.subjectId : null}
        onPick={(id) => {
          moveItem(moving.id, id);
          setMoving(null);
          toast(id ? '옮겼어요' : '임시 보관함으로 옮겼어요');
        }}
        onClose={() => setMoving(null)}
      />

      <NameSheet
        visible={!!renaming}
        title="자료 이름"
        initial={renaming ? renaming.title : ''}
        placeholder={renaming ? itemTitle({ ...renaming, title: '' }) : ''}
        allowEmpty
        onClose={() => setRenaming(null)}
        onSubmit={(t) => {
          renameItem(renaming.id, t);
          setRenaming(null);
        }}
      />
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  grid: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 6 },
  row: { gap: 12, marginBottom: 14 },
  itemCard: { flex: 1, maxWidth: '48.4%' },
  itemCover: { width: '100%', aspectRatio: 0.75, borderRadius: 14 },
  countPill: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,18,24,0.72)',
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 11,
  },
  countText: { fontFamily: font.bold, fontSize: 11.5, color: '#fff' },
  favBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15,18,24,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { fontFamily: font.semibold, fontSize: 14.5, color: colors.ink, marginTop: 8 },
  itemFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3, minHeight: 24 },
  itemDate: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint },
  classify: { backgroundColor: colors.accentSoft, borderRadius: 10, paddingHorizontal: 10, height: 24, justifyContent: 'center' },
  classifyText: { fontFamily: font.bold, fontSize: 12, color: colors.accent },
}));
