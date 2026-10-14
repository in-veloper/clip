import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, BackHandler } from 'react-native';

import {
  useStore,
  itemTitle,
  subjectName,
  addPages,
  moveItem,
  renameItem,
  deleteItem,
  deletePage,
  toggleFav,
} from '../store';
import { scanPages } from '../scan';
import { colors, font, themedStyles } from '../theme';
import { Header, IconButton, Icon, Chip, Sheet, SheetItem, Empty, Button, toast, confirmDialog } from '../ui';
import { sharePages } from '../share';
import { Thumb, NameSheet, PickSheet } from '../components/common';

export default function ItemScreen({ route, nav }) {
  const state = useStore();
  const item = state.items.find((it) => it.id === route.id);

  const [menu, setMenu] = useState(false);
  const [pageMenu, setPageMenu] = useState(null);
  const [moving, setMoving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  // 공유할 사진 고르기 모드. null 이면 평소 화면, Set 이면 고른 페이지 id 들.
  const [picked, setPicked] = useState(null);

  // 고르는 중에 뒤로 가기를 누르면 화면을 나가지 말고 고르기만 끝낸다.
  useEffect(() => {
    if (picked === null) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPicked(null);
      return true;
    });
    return () => sub.remove();
  }, [picked === null]);

  if (!item) {
    return (
      <View style={styles.fill}>
        <Header title="" onBack={nav.pop} />
        <Empty title="자료를 찾을 수 없어요" />
      </View>
    );
  }

  const addMore = async () => {
    try {
      const files = await scanPages({ tag: itemTitle(item) });
      if (!files.length) return;
      addPages(item.id, files);
      toast(`${files.length}장 추가했어요`);
    } catch (e) {
      toast('스캔을 시작하지 못했어요', 'error');
    }
  };

  const confirmDeleteItem = () => {
    setMenu(false);
    confirmDialog({
      title: '자료를 삭제할까요?',
      message: `"${itemTitle(item)}"\n${item.pages.length}페이지가 함께 지워져요.`,
      confirmLabel: '삭제',
      onConfirm: () => {
        nav.pop();
        deleteItem(item.id);
      },
    });
  };

  const confirmDeletePage = (page) => {
    setPageMenu(null);
    const last = item.pages.length <= 1;
    confirmDialog({
      title: '페이지를 삭제할까요?',
      message: last ? '마지막 페이지라서\n자료도 함께 지워져요.' : '이 페이지를 자료에서 지워요.',
      confirmLabel: '삭제',
      onConfirm: () => {
        if (last) nav.pop();
        deletePage(item.id, page.id);
      },
    });
  };

  const favCount = item.pages.filter((p) => p.fav).length;
  const selecting = picked !== null;

  const togglePick = (id) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allPicked = selecting && picked.size === item.pages.length;

  const sendPicked = async () => {
    // 고른 순서가 아니라 자료의 페이지 순서대로 공유한다
    const pages = item.pages.filter((p) => picked.has(p.id));
    if (!pages.length) return;
    if (await sharePages(pages, itemTitle(item))) setPicked(null);
  };

  return (
    <View style={styles.fill}>
      {selecting ? (
        <Header
          title="공유할 사진 고르기"
          subtitle={picked.size ? `${picked.size}장 선택` : '사진을 눌러서 고르세요'}
          left={<IconButton name="close" onPress={() => setPicked(null)} />}
          right={
            <Pressable
              hitSlop={10}
              onPress={() => setPicked(allPicked ? new Set() : new Set(item.pages.map((p) => p.id)))}
            >
              <Text style={styles.allText}>{allPicked ? '선택 해제' : '전체 선택'}</Text>
            </Pressable>
          }
        />
      ) : (
        <Header
          title={itemTitle(item)}
          subtitle={`${subjectName(state, item.subjectId)} · ${item.pages.length}페이지${favCount ? ` · 즐겨찾기 ${favCount}` : ''}`}
          onBack={nav.pop}
          right={<IconButton name="more" onPress={() => setMenu(true)} />}
        />
      )}

      {!selecting && (
        <View style={styles.actions}>
          <Chip icon="scan" label="페이지 추가" onPress={addMore} />
          <Chip icon="reorder" label="순서 변경" onPress={() => nav.push('reorder', { id: item.id })} />
          <Chip icon="share" label="공유" onPress={() => setPicked(new Set())} />
        </View>
      )}

      <FlatList
        data={item.pages}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        extraData={picked}
        renderItem={({ item: page, index }) => {
          const on = selecting && picked.has(page.id);
          return (
          <Pressable
            style={styles.cell}
            onPress={() => (selecting ? togglePick(page.id) : nav.push('viewer', { itemId: item.id, index }))}
            onLongPress={() => (selecting ? togglePick(page.id) : setPageMenu(page))}
          >
            <Thumb file={page.file} style={[styles.thumb, selecting && !on && styles.thumbDim]} />
            {selecting ? (
              <View style={[styles.pick, on && styles.pickOn]}>
                {on ? <Icon name="check" size={14} color="#fff" stroke={2.6} /> : null}
              </View>
            ) : null}
            <View style={styles.num}>
              <Text style={styles.numText}>{index + 1}</Text>
            </View>
            {page.fav ? (
              <View style={styles.star}>
                <Icon name="star" size={14} color={colors.star} fill={colors.star} stroke={1.5} />
              </View>
            ) : null}
          </Pressable>
          );
        }}
      />

      {selecting && (
        <View style={styles.footer}>
          <Button
            title={picked.size ? `${picked.size}장 공유` : '공유할 사진을 고르세요'}
            icon="share"
            disabled={!picked.size}
            onPress={sendPicked}
          />
        </View>
      )}

      <Sheet visible={menu} onClose={() => setMenu(false)} title={itemTitle(item)}>
        <SheetItem
          icon="edit"
          label="이름 변경"
          onPress={() => {
            setMenu(false);
            setRenaming(true);
          }}
        />
        <SheetItem
          icon="move"
          label="과목 이동"
          onPress={() => {
            setMenu(false);
            setMoving(true);
          }}
        />
        <SheetItem icon="trash" label="자료 삭제" danger onPress={confirmDeleteItem} />
      </Sheet>

      <Sheet visible={!!pageMenu} onClose={() => setPageMenu(null)} title="페이지">
        <SheetItem
          icon="star"
          label={pageMenu && pageMenu.fav ? '즐겨찾기 해제' : '즐겨찾기'}
          onPress={() => {
            toggleFav(item.id, pageMenu.id);
            setPageMenu(null);
          }}
        />
        <SheetItem
          icon="share"
          label="이 페이지 공유"
          onPress={() => {
            const page = pageMenu;
            setPageMenu(null);
            sharePages([page], itemTitle(item));
          }}
        />
        <SheetItem icon="trash" label="페이지 삭제" danger onPress={() => confirmDeletePage(pageMenu)} />
      </Sheet>

      <PickSheet
        visible={moving}
        title="어느 과목으로 옮길까요?"
        subjects={state.subjects}
        selectedId={item.subjectId}
        onPick={(id) => {
          moveItem(item.id, id);
          setMoving(false);
          toast(id ? '옮겼어요' : '임시 보관함으로 옮겼어요');
        }}
        onClose={() => setMoving(false)}
      />

      <NameSheet
        visible={renaming}
        title="자료 이름"
        initial={item.title}
        placeholder={itemTitle({ ...item, title: '' })}
        allowEmpty
        onClose={() => setRenaming(false)}
        onSubmit={(t) => {
          renameItem(item.id, t);
          setRenaming(false);
        }}
      />
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12, flexWrap: 'wrap' },
  grid: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { gap: 10, marginBottom: 10 },
  cell: { flex: 1, maxWidth: '32%' },
  // 흰 종이 사진이 흰 바탕에 묻히지 않게 얇은 테두리로 칸을 나눈다
  thumb: { width: '100%', aspectRatio: 0.75, borderRadius: 10, borderWidth: 1, borderColor: colors.frame },
  thumbDim: { opacity: 0.55 },
  pick: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(15,18,24,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  allText: { fontFamily: font.semibold, fontSize: 14, color: colors.accent, paddingHorizontal: 4 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  num: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(15,18,24,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontFamily: font.bold, fontSize: 11.5, color: '#fff' },
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
}));
