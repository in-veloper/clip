import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';

import {
  useStore,
  setTheme,
  createItem,
  addSubject,
  deleteSubject,
  renameSubject,
  itemsOf,
  favoritesOf,
  itemTitle,
  subjectName,
  INBOX,
} from '../store';
import { scanPages } from '../scan';
import { removeFile } from '../files';
import { colors, font, themedStyles } from '../theme';
import { Icon, Card, Sheet, SheetItem, IconButton, PillButton, Button, toast, confirmDialog } from '../ui';
import { Thumb, NameSheet, PickSheet } from '../components/common';

function ScanButton({ label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.scan, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={styles.scanIcon}>
        <Icon name="scan" size={30} color="#fff" stroke={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.scanTitle}>스캔하기</Text>
        {label ? <Text style={styles.scanSub}>{label}</Text> : null}
      </View>
      <Icon name="chevronRight" size={22} color="rgba(255,255,255,0.8)" />
    </Pressable>
  );
}

function MiniCard({ icon, count, onPress, tint }) {
  return (
    <Card onPress={onPress} style={styles.mini}>
      <View style={[styles.miniIcon, { backgroundColor: `${tint}22` }]}>
        <Icon name={icon} size={21} color={tint} fill={icon === 'star' ? tint : undefined} />
      </View>
      <Text style={styles.miniCount}>{count}</Text>
    </Card>
  );
}

function SubjectCard({ subject, items, onPress, onLongPress }) {
  const favs = items.reduce((n, it) => n + it.pages.filter((p) => p.fav).length, 0);
  const covers = items.slice(0, 4).map((it) => it.pages[0]);
  const more = items.length - covers.length;

  return (
    <Card onPress={onPress} onLongPress={onLongPress} style={styles.subject}>
      <View style={styles.subjectTop}>
        <View style={[styles.subjectTile, { backgroundColor: `${subject.color}22` }]}>
          <Icon name="folder" size={22} color={subject.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject.name}
          </Text>
          {favs > 0 ? (
            <View style={styles.favChip}>
              <Icon name="star" size={11} color={colors.star} fill={colors.star} stroke={1.5} />
              <Text style={styles.favChipText}>{favs}</Text>
            </View>
          ) : null}
        </View>
        <Icon name="chevronRight" size={20} color={colors.inkFaint} />
      </View>

      {covers.length > 0 ? (
        <View style={styles.coverRow}>
          {covers.map((p) => (
            <Thumb key={p.id} file={p.file} style={styles.coverThumb} />
          ))}
          {more > 0 ? (
            <View style={styles.moreTile}>
              <Text style={styles.moreText}>+{more}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.emptyStrip}>
          <Text style={styles.emptyStripText}>아직 스캔한 페이지가 없어요</Text>
        </View>
      )}
    </Card>
  );
}

export default function HomeScreen({ nav }) {
  const state = useStore();
  const { subjects, items, theme, lastSubjectId, lastView } = state;

  const [pending, setPending] = useState(null); // 스캔했지만 아직 저장 위치를 안 고른 파일들
  const [menuFor, setMenuFor] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [scanning, setScanning] = useState(false);

  const inboxCount = useMemo(() => itemsOf(state, INBOX).length, [state]);
  const favCount = useMemo(() => favoritesOf(state).length, [state]);

  const resume = useMemo(() => {
    if (!lastView) return null;
    const item = items.find((it) => it.id === lastView.itemId);
    if (!item) return null;
    const index = item.pages.findIndex((p) => p.id === lastView.pageId);
    if (index < 0) return null;
    return { item, index };
  }, [lastView, items]);

  const lastSubject = subjects.find((s) => s.id === lastSubjectId);

  const startScan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const files = await scanPages({ tag: lastSubject ? lastSubject.name : '샘플' });
      if (files.length) setPending(files);
    } catch (e) {
      toast('스캔을 시작하지 못했어요', 'error');
    } finally {
      setScanning(false);
    }
  };

  const savePending = (subjectId) => {
    const files = pending;
    setPending(null);
    createItem({ subjectId, files });
    toast(subjectId ? `${subjectName(state, subjectId)}에 ${files.length}장 저장했어요` : `임시 보관함에 ${files.length}장 저장했어요`);
  };

  const dropPending = () => {
    (pending || []).forEach(removeFile);
    setPending(null);
  };

  const confirmDelete = (subject) => {
    setMenuFor(null);
    confirmDialog({
      title: '과목을 삭제할까요?',
      message: `"${subject.name}" 과목만 지워지고,\n안에 있던 자료는 임시 보관함으로 옮겨져요.`,
      confirmLabel: '삭제',
      onConfirm: () => deleteSubject(subject.id),
    });
  };

  return (
    <View style={styles.fill}>
      <View style={styles.top}>
        <Text style={styles.brand}>CLIP</Text>
        <IconButton
          name={theme === 'dark' ? 'sun' : 'moon'}
          color={colors.inkSoft}
          onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={styles.themeBtn}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <ScanButton label={lastSubject ? `저장 위치 · ${lastSubject.name}` : null} onPress={startScan} />

        {resume && (
          <Card
            onPress={() => nav.push('viewer', { itemId: resume.item.id, index: resume.index })}
            style={styles.resume}
          >
            <Thumb file={resume.item.pages[resume.index].file} style={styles.resumeThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resumeLabel}>이어서 보기</Text>
              <Text style={styles.resumeTitle} numberOfLines={1}>
                {itemTitle(resume.item)}
              </Text>
              <Text style={styles.resumeMeta} numberOfLines={1}>
                {subjectName(state, resume.item.subjectId)} · {resume.index + 1}/{resume.item.pages.length}쪽
              </Text>
            </View>
            <Icon name="chevronRight" size={20} color={colors.inkFaint} />
          </Card>
        )}

        <View style={styles.miniRow}>
          <MiniCard icon="inbox" count={inboxCount} tint={colors.inkSoft} onPress={() => nav.push('subject', { id: INBOX })} />
          <MiniCard icon="star" count={favCount} tint={colors.star} onPress={() => nav.push('favorites')} />
        </View>

        <View style={styles.sectionHead}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.section}>과목</Text>
            {subjects.length > 0 ? <Text style={styles.sectionCount}>{subjects.length}</Text> : null}
          </View>
          {subjects.length > 0 ? (
            <View style={styles.sectionActions}>
              {subjects.length > 1 ? (
                <Pressable
                  onPress={() => nav.push('subjectOrder')}
                  hitSlop={8}
                  style={({ pressed }) => [styles.orderBtn, pressed && { opacity: 0.7 }]}
                >
                  <Icon name="reorder" size={18} color={colors.inkSoft} />
                </Pressable>
              ) : null}
              <PillButton icon="plus" label="과목 추가" onPress={() => setRenaming({ id: null })} />
            </View>
          ) : null}
        </View>

        {subjects.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Icon name="folder" size={28} color={colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>첫 과목을 만들어 보세요</Text>
            <Text style={styles.emptySub}>과목을 만들어 두면 스캔한 페이지를{'\n'}바로 분류해서 저장할 수 있어요.</Text>
            <Button
              title="과목 만들기"
              kind="accent"
              icon="plus"
              onPress={() => setRenaming({ id: null })}
              style={styles.emptyBtn}
            />
          </Card>
        ) : (
          subjects.map((s) => (
            <SubjectCard
              key={s.id}
              subject={s}
              items={itemsOf(state, s.id)}
              onPress={() => nav.push('subject', { id: s.id })}
              onLongPress={() => setMenuFor(s)}
            />
          ))
        )}
      </ScrollView>

      <PickSheet
        visible={!!pending}
        title={pending ? `${pending.length}장 스캔했어요` : ''}
        subjects={subjects}
        selectedId={lastSubjectId}
        confirmLabel="저장"
        onPick={savePending}
        onClose={dropPending}
      />

      <NameSheet
        visible={!!renaming}
        title={renaming && renaming.id ? '과목 이름 변경' : '과목 추가'}
        initial={renaming && renaming.id ? subjects.find((s) => s.id === renaming.id)?.name : ''}
        placeholder="과목 이름"
        submitLabel={renaming && renaming.id ? '저장' : '추가'}
        onClose={() => setRenaming(null)}
        onSubmit={(name) => {
          if (renaming.id) renameSubject(renaming.id, name);
          else addSubject(name);
          setRenaming(null);
        }}
      />

      <Sheet visible={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.name}>
        <SheetItem
          icon="edit"
          label="이름 변경"
          onPress={() => {
            const id = menuFor.id;
            setMenuFor(null);
            setRenaming({ id });
          }}
        />
        <SheetItem icon="trash" label="과목 삭제" danger onPress={() => confirmDelete(menuFor)} />
      </Sheet>
    </View>
  );
}

const styles = themedStyles(() => ({
  fill: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 10 },
  brand: { flex: 1, fontFamily: font.bold, fontSize: 20, color: colors.ink, letterSpacing: 5 },
  themeBtn: { backgroundColor: colors.surface },
  list: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 40, gap: 12 },
  scan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.accent,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  scanIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontFamily: font.bold, fontSize: 20, color: '#fff' },
  scanSub: { fontFamily: font.regular, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12 },
  resumeThumb: { width: 48, height: 64, borderRadius: 8 },
  resumeLabel: { fontFamily: font.semibold, fontSize: 12, color: colors.accent, marginBottom: 2 },
  resumeTitle: { fontFamily: font.bold, fontSize: 15.5, color: colors.ink },
  resumeMeta: { fontFamily: font.regular, fontSize: 12.5, color: colors.inkFaint, marginTop: 2 },
  miniRow: { flexDirection: 'row', gap: 12 },
  mini: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 18 },
  miniIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  miniCount: { fontFamily: font.bold, fontSize: 28, color: colors.ink, letterSpacing: -0.6 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  section: { fontFamily: font.bold, fontSize: 17, color: colors.ink, marginLeft: 4 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  sectionCount: {
    fontFamily: font.bold,
    fontSize: 12.5,
    color: colors.inkSoft,
    backgroundColor: colors.surfaceAlt,
    minWidth: 22,
    height: 22,
    lineHeight: 22,
    textAlign: 'center',
    borderRadius: 11,
    overflow: 'hidden',
    paddingHorizontal: 6,
  },
  emptyCard: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontFamily: font.bold, fontSize: 18, color: colors.ink },
  emptySub: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: colors.inkFaint, textAlign: 'center', marginTop: 8 },
  emptyBtn: { alignSelf: 'stretch', marginTop: 22 },
  subject: { padding: 16 },
  subjectTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  subjectTile: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subjectName: { fontFamily: font.bold, fontSize: 17.5, color: colors.ink, letterSpacing: -0.2 },
  favChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  favChipText: { fontFamily: font.bold, fontSize: 11.5, color: colors.inkSoft },
  coverRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  coverThumb: { width: 54, height: 72, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  moreTile: {
    width: 54,
    height: 72,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontFamily: font.bold, fontSize: 14, color: colors.inkSoft },
  emptyStrip: {
    marginTop: 14,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStripText: { fontFamily: font.regular, fontSize: 13, color: colors.inkFaint },
}));
