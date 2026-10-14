import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { removeFile } from './files';
import { SUBJECT_COLORS } from './theme';
import { colorDistance } from './colorMath';

const DATA_KEY = 'clip/data';
const THEME_KEY = 'clip/theme';

export const INBOX = 'inbox';

let counter = 0;
export function uid() {
  counter += 1;
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

let state = {
  loaded: false,
  subjects: [], // { id, name, color }
  items: [], // { id, subjectId(null=임시 보관함), title, createdAt, pages: [{ id, file, fav }] }
  lastSubjectId: null,
  lastView: null, // { itemId, pageId }
  theme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
};
const listeners = new Set();

function emit(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore() {
  return useSyncExternalStore(subscribe, () => state);
}

export function getState() {
  return state;
}

async function persist() {
  try {
    const { subjects, items, lastSubjectId, lastView } = state;
    await AsyncStorage.setItem(DATA_KEY, JSON.stringify({ subjects, items, lastSubjectId, lastView }));
  } catch {
    // 다음 변경 때 다시 저장된다.
  }
}

export async function init() {
  try {
    const [raw, theme] = await Promise.all([AsyncStorage.getItem(DATA_KEY), AsyncStorage.getItem(THEME_KEY)]);
    const data = raw ? JSON.parse(raw) : {};
    emit({
      loaded: true,
      subjects: dedupeSubjectColors(data.subjects || []),
      items: data.items || [],
      lastSubjectId: data.lastSubjectId || null,
      lastView: data.lastView || null,
      theme: theme === 'dark' || theme === 'light' ? theme : state.theme,
    });
  } catch {
    emit({ loaded: true });
  }
}

export function setTheme(theme) {
  emit({ theme });
  AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
}

/* ---------- 과목 ---------- */

// 새 과목 색: 지금 쓰는 색들과 눈으로 가장 멀리 떨어진 팔레트 색.
// 팔레트를 다 쓴 뒤에는 가장 적게 쓴 색부터 다시 쓴다.
export function pickSubjectColor(colorsInUse) {
  if (!colorsInUse.length) return SUBJECT_COLORS[0];
  let best = null;
  let bestScore = -1;
  for (const c of SUBJECT_COLORS) {
    const nearest = Math.min(...colorsInUse.map((u) => colorDistance(c, u)));
    if (nearest > bestScore + 0.001) {
      best = c;
      bestScore = nearest;
    }
  }
  if (bestScore >= 1) return best;
  const count = {};
  colorsInUse.forEach((c) => (count[c] = (count[c] || 0) + 1));
  return SUBJECT_COLORS.reduce((a, c) => ((count[c] || 0) < (count[a] || 0) ? c : a), SUBJECT_COLORS[0]);
}

const TOO_CLOSE = 40;

// 앞선 과목과 색이 같거나 비슷하면(예전 팔레트로 만든 과목 포함) 가장 안 비슷한 색으로 바꾼다.
function dedupeSubjectColors(subjects) {
  const kept = [];
  let changed = false;
  const out = subjects.map((s) => {
    const nearest = kept.length ? Math.min(...kept.map((k) => colorDistance(s.color, k))) : Infinity;
    if (nearest >= TOO_CLOSE) {
      kept.push(s.color);
      return s;
    }
    const next = pickSubjectColor(kept);
    const nextNearest = Math.min(...kept.map((k) => colorDistance(next, k)));
    if (nextNearest <= nearest) {
      kept.push(s.color);
      return s;
    }
    kept.push(next);
    changed = true;
    return { ...s, color: next };
  });
  return changed ? out : subjects;
}

export function addSubject(name) {
  const id = uid();
  const subject = { id, name: name.trim(), color: pickSubjectColor(state.subjects.map((s) => s.color)) };
  emit({ subjects: [...state.subjects, subject] });
  persist();
  return id;
}

export function reorderSubjects(orderedIds) {
  const byId = {};
  state.subjects.forEach((s) => (byId[s.id] = s));
  const next = orderedIds.map((id) => byId[id]).filter(Boolean);
  state.subjects.forEach((s) => {
    if (!next.includes(s)) next.push(s);
  });
  emit({ subjects: next });
  persist();
}

export function renameSubject(id, name) {
  emit({ subjects: state.subjects.map((s) => (s.id === id ? { ...s, name: name.trim() } : s)) });
  persist();
}

// 과목을 지워도 안에 있던 자료는 사라지지 않고 임시 보관함으로 옮겨진다.
export function deleteSubject(id) {
  emit({
    subjects: state.subjects.filter((s) => s.id !== id),
    items: state.items.map((it) => (it.subjectId === id ? { ...it, subjectId: null } : it)),
    lastSubjectId: state.lastSubjectId === id ? null : state.lastSubjectId,
  });
  persist();
}

/* ---------- 자료(한 번에 찍은 여러 페이지) ---------- */

function makePages(files) {
  return files.map((file) => ({ id: uid(), file, fav: false }));
}

export function createItem({ subjectId, files }) {
  const id = uid();
  const item = { id, subjectId: subjectId || null, title: '', createdAt: Date.now(), pages: makePages(files) };
  emit({
    items: [item, ...state.items],
    lastSubjectId: subjectId ? subjectId : state.lastSubjectId,
  });
  persist();
  return id;
}

export function addPages(itemId, files) {
  emit({ items: state.items.map((it) => (it.id === itemId ? { ...it, pages: [...it.pages, ...makePages(files)] } : it)) });
  persist();
}

export function moveItem(itemId, subjectId) {
  emit({
    items: state.items.map((it) => (it.id === itemId ? { ...it, subjectId: subjectId || null } : it)),
    lastSubjectId: subjectId ? subjectId : state.lastSubjectId,
  });
  persist();
}

export function renameItem(itemId, title) {
  emit({ items: state.items.map((it) => (it.id === itemId ? { ...it, title: title.trim() } : it)) });
  persist();
}

export function deleteItem(itemId) {
  const item = state.items.find((it) => it.id === itemId);
  if (item) item.pages.forEach((p) => removeFile(p.file));
  emit({
    items: state.items.filter((it) => it.id !== itemId),
    lastView: state.lastView && state.lastView.itemId === itemId ? null : state.lastView,
  });
  persist();
}

/* ---------- 페이지 ---------- */

export function deletePage(itemId, pageId) {
  const item = state.items.find((it) => it.id === itemId);
  const page = item && item.pages.find((p) => p.id === pageId);
  if (page) removeFile(page.file);
  // 페이지가 하나도 안 남으면 자료도 함께 지운다.
  if (item && item.pages.length <= 1) {
    deleteItem(itemId);
    return;
  }
  emit({
    items: state.items.map((it) => (it.id === itemId ? { ...it, pages: it.pages.filter((p) => p.id !== pageId) } : it)),
    lastView: state.lastView && state.lastView.pageId === pageId ? null : state.lastView,
  });
  persist();
}

export function toggleFav(itemId, pageId) {
  emit({
    items: state.items.map((it) =>
      it.id === itemId ? { ...it, pages: it.pages.map((p) => (p.id === pageId ? { ...p, fav: !p.fav } : p)) } : it
    ),
  });
  persist();
}

export function reorderPages(itemId, orderedIds) {
  emit({
    items: state.items.map((it) => {
      if (it.id !== itemId) return it;
      const byId = {};
      it.pages.forEach((p) => (byId[p.id] = p));
      const next = orderedIds.map((id) => byId[id]).filter(Boolean);
      it.pages.forEach((p) => {
        if (!next.includes(p)) next.push(p);
      });
      return { ...it, pages: next };
    }),
  });
  persist();
}

export function setLastView(itemId, pageId) {
  if (state.lastView && state.lastView.itemId === itemId && state.lastView.pageId === pageId) return;
  emit({ lastView: { itemId, pageId } });
  persist();
}

/* ---------- 조회 ---------- */

export function itemsOf(snapshot, subjectId) {
  return snapshot.items.filter((it) => (subjectId === INBOX ? !it.subjectId : it.subjectId === subjectId));
}

export function favoritesOf(snapshot) {
  const out = [];
  snapshot.items.forEach((it) => {
    it.pages.forEach((p, index) => {
      if (p.fav) out.push({ item: it, page: p, index });
    });
  });
  return out;
}

export function itemTitle(item) {
  if (item.title) return item.title;
  const d = new Date(item.createdAt);
  const h = d.getHours();
  const ampm = h < 12 ? '오전' : '오후';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${hh}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function subjectName(snapshot, subjectId) {
  if (!subjectId) return '임시 보관함';
  const s = snapshot.subjects.find((x) => x.id === subjectId);
  return s ? s.name : '임시 보관함';
}
