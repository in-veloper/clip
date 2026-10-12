import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';

import { pageUri } from '../files';
import { addSubject } from '../store';
import { colors, font, themedStyles } from '../theme';
import { Sheet, Button, Icon } from '../ui';

export function Thumb({ file, style }) {
  const uri = pageUri(file);
  return (
    <View style={[styles.thumbBase, style]}>
      {uri ? <Image source={{ uri }} resizeMode="cover" resizeMethod="resize" style={StyleSheet.absoluteFill} /> : null}
    </View>
  );
}

export function NameSheet({ visible, title, initial, placeholder, submitLabel = '저장', onSubmit, onClose, allowEmpty }) {
  const [text, setText] = useState(initial || '');
  useEffect(() => {
    if (visible) setText(initial || '');
  }, [visible, initial]);

  const ok = allowEmpty || text.trim().length > 0;
  const submit = () => {
    if (!ok) return;
    onSubmit(text.trim());
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <TextInput
        value={text}
        onChangeText={setText}
        autoFocus
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        returnKeyType="done"
        onSubmitEditing={submit}
        style={styles.input}
      />
      <Button title={submitLabel} onPress={submit} disabled={!ok} style={{ marginTop: 14 }} />
    </Sheet>
  );
}

// 과목 고르기. confirmLabel 이 있으면 고른 뒤 버튼으로 확정하고, 없으면 누르는 즉시 선택된다.
export function PickSheet({ visible, title, subjects, selectedId, onPick, confirmLabel, inboxLabel = '임시 보관함', onClose }) {
  const [sel, setSel] = useState(selectedId ?? null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (visible) {
      setSel(selectedId ?? null);
      setCreating(false);
      setName('');
    }
  }, [visible, selectedId]);

  const choose = (id) => {
    if (confirmLabel) setSel(id);
    else onPick(id);
  };

  const create = () => {
    if (!name.trim()) return;
    const id = addSubject(name);
    setName('');
    setCreating(false);
    choose(id);
  };

  const rows = [{ id: null, name: inboxLabel, color: colors.inkFaint, inbox: true }, ...subjects];

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {rows.map((r) => {
        const on = confirmLabel && sel === r.id;
        return (
          <Pressable key={r.id || 'inbox'} onPress={() => choose(r.id)} style={styles.pickRow}>
            {r.inbox ? (
              <Icon name="inbox" size={20} color={colors.inkSoft} />
            ) : (
              <View style={[styles.pickDot, { backgroundColor: r.color }]} />
            )}
            <Text style={[styles.pickText, on && { fontFamily: font.bold, color: colors.accent }]} numberOfLines={1}>
              {r.name}
            </Text>
            {on ? <Icon name="check" size={20} color={colors.accent} /> : null}
          </Pressable>
        );
      })}

      {creating ? (
        <View style={styles.createRow}>
          <TextInput
            value={name}
            onChangeText={setName}
            autoFocus
            placeholder="새 과목 이름"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="done"
            onSubmitEditing={create}
            style={[styles.input, { flex: 1 }]}
          />
          <Button title="추가" kind="soft" onPress={create} disabled={!name.trim()} style={styles.createBtn} />
        </View>
      ) : (
        <Pressable onPress={() => setCreating(true)} style={({ pressed }) => [styles.newRow, pressed && { opacity: 0.7 }]}>
          <Icon name="plus" size={18} color={colors.accent} stroke={2.4} />
          <Text style={styles.newText}>새 과목 만들기</Text>
        </Pressable>
      )}

      {confirmLabel ? (
        <Button title={confirmLabel} onPress={() => onPick(sel)} style={{ marginTop: 14 }} />
      ) : null}
    </Sheet>
  );
}

const styles = themedStyles(() => ({
  thumbBase: { backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 16,
    fontFamily: font.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  pickDot: { width: 20, height: 20, borderRadius: 10 },
  pickText: { flex: 1, fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  newRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    marginTop: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  newText: { fontFamily: font.bold, fontSize: 15, color: colors.accent },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  createBtn: { height: 52, paddingHorizontal: 18 },
}));
