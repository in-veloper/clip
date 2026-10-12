import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, Animated, Keyboard, Platform } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { colors, font, shadow, themedStyles } from './theme';

const ICONS = {
  back: 'M15 5 L8 12 L15 19',
  plus: 'M12 5 V19 M5 12 H19',
  close: 'M6 6 L18 18 M18 6 L6 18',
  check: 'M5 12.5 L10 17 L19 7',
  chevronRight: 'M9 5 L16 12 L9 19',
  more: 'M5 12 h.01 M12 12 h.01 M19 12 h.01',
  edit: 'M5 19 H9 L19 9 L15 5 L5 15 Z',
  trash: 'M5 7 H19 M10 7 V5 H14 V7 M7 7 L8 19 H16 L17 7',
  moon: 'M20 14.5 A8 8 0 1 1 9.5 4 A6.5 6.5 0 0 0 20 14.5 Z',
  sun: 'M12 2.5 V4.5 M12 19.5 V21.5 M2.5 12 H4.5 M19.5 12 H21.5 M5.3 5.3 L6.7 6.7 M17.3 17.3 L18.7 18.7 M5.3 18.7 L6.7 17.3 M17.3 6.7 L18.7 5.3',
  scan: 'M4 8 V5.5 A1.5 1.5 0 0 1 5.5 4 H8 M16 4 H18.5 A1.5 1.5 0 0 1 20 5.5 V8 M20 16 V18.5 A1.5 1.5 0 0 1 18.5 20 H16 M8 20 H5.5 A1.5 1.5 0 0 1 4 18.5 V16 M8 12 H16',
  star: 'M12 3.6 L14.5 9 L20.4 9.7 L16 13.7 L17.2 19.6 L12 16.7 L6.8 19.6 L8 13.7 L3.6 9.7 L9.5 9 Z',
  folder: 'M3.5 7 V17.5 A1.5 1.5 0 0 0 5 19 H19 A1.5 1.5 0 0 0 20.5 17.5 V9.5 A1.5 1.5 0 0 0 19 8 H12 L10 5.5 H5 A1.5 1.5 0 0 0 3.5 7 Z',
  inbox: 'M4 13 L6.5 5.5 H17.5 L20 13 V18 A1 1 0 0 1 19 19 H5 A1 1 0 0 1 4 18 Z M4 13 H9 A3 3 0 0 0 15 13 H20',
  move: 'M5 12 H19 M13 6 L19 12 L13 18',
  reorder: 'M8 6 H19 M8 12 H19 M8 18 H19 M4 6 h.01 M4 12 h.01 M4 18 h.01',
  grip: 'M9 6 h.01 M15 6 h.01 M9 12 h.01 M15 12 h.01 M9 18 h.01 M15 18 h.01',
  pages: 'M7 4 H17 A1 1 0 0 1 18 5 V16 A1 1 0 0 1 17 17 H7 A1 1 0 0 1 6 16 V5 A1 1 0 0 1 7 4 Z M9 20 H18 A2 2 0 0 0 20 18 V8',
};

export function Icon({ name, size = 22, color = colors.ink, stroke = 2, fill }) {
  const dots = name === 'more' || name === 'grip' || name === 'reorder';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={ICONS[name]}
        stroke={color}
        strokeWidth={dots ? stroke + 1.2 : stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill || 'none'}
      />
      {name === 'sun' && <Circle cx="12" cy="12" r="4.2" stroke={color} strokeWidth={stroke} fill="none" />}
    </Svg>
  );
}

export function Header({ title, subtitle, onBack, right, left }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.headerBtn}>
            <Icon name="back" size={24} />
          </Pressable>
        ) : (
          left || null
        )}
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.headerSide, { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' }]}>
        {right}
      </View>
    </View>
  );
}

export function IconButton({ name, onPress, color, size = 22, active, style }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={[styles.iconBtn, active && styles.iconBtnOn, style]}>
      <Icon name={name} size={size} color={color || colors.ink} />
    </Pressable>
  );
}

export function Button({ title, onPress, kind = 'primary', disabled, style, icon }) {
  const k = buttonLook(kind);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        k.box,
        disabled && { opacity: 0.35 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={k.text.color} /> : null}
      <Text style={[styles.btnText, k.text]}>{title}</Text>
    </Pressable>
  );
}

const buttonLook = (kind) =>
  ({
    primary: { box: { backgroundColor: colors.ink }, text: { color: colors.onInk } },
    accent: { box: { backgroundColor: colors.accent }, text: { color: '#fff' } },
    soft: { box: { backgroundColor: colors.surfaceAlt }, text: { color: colors.ink } },
    danger: { box: { backgroundColor: colors.bad }, text: { color: '#fff' } },
    ghost: { box: { backgroundColor: 'transparent' }, text: { color: colors.inkSoft } },
  })[kind];

// 화면 옆에 붙는 작은 동작 버튼. soft: 연한 배경, solid: 꽉 찬 배경
export function PillButton({ label, icon, onPress, kind = 'soft', style }) {
  const solid = kind === 'solid';
  const fg = solid ? '#fff' : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pillBtn,
        solid && styles.pillBtnSolid,
        pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={17} color={fg} stroke={2.4} /> : null}
      <Text style={[styles.pillBtnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color = colors.accent, icon }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
    >
      {icon ? <Icon name={icon} size={15} color={active ? '#fff' : colors.inkSoft} /> : null}
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, onPress, onLongPress }) {
  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.99 }] }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Sheet({ visible, onClose, title, children }) {
  const sheetRef = useRef(null);
  const [lift, setLift] = useState(0);
  const liftRef = useRef(0);
  liftRef.current = lift;

  // 모달 창은 키보드가 올라와도 줄어들지 않아서 입력칸이 가려진다.
  // 키보드 윗선과 시트 아랫선을 재서, 겹친 만큼만 시트를 위로 올린다(이미 줄어든 기기에서는 0).
  useEffect(() => {
    if (!visible || Platform.OS === 'web') {
      setLift(0);
      return undefined;
    }
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      setTimeout(() => {
        if (!sheetRef.current) return;
        sheetRef.current.measureInWindow((x, y, w, h) => {
          const overlap = y + h - keyboardTop;
          setLift(Math.max(0, liftRef.current + overlap + 12));
        });
      }, 60);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setLift(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.sheetWrap, { paddingBottom: lift }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet} ref={sheetRef} collapsable={false}>
          <View style={styles.sheetGrip} />
          {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
          <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function SheetItem({ icon, label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.sheetItem, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} size={20} color={danger ? colors.bad : colors.inkSoft} />
      <Text style={[styles.sheetItemText, danger && { color: colors.bad }]}>{label}</Text>
    </Pressable>
  );
}

export function Empty({ title, sub, children }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
      {children}
    </View>
  );
}

/* ---------- 알림(토스트) ---------- */

const toastListeners = new Set();
// type: 'success' | 'error'
export function toast(message, type = 'success') {
  toastListeners.forEach((l) => l({ message, type }));
}

export function ToastHost() {
  const [t, setT] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  useEffect(() => {
    const listener = (next) => {
      setT(next);
      clearTimeout(timer.current);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, friction: 9, tension: 110, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setT(null));
      }, 2300);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
      clearTimeout(timer.current);
    };
  }, []);

  if (!t) return null;
  const ok = t.type !== 'error';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastWrap,
        {
          opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
        },
      ]}
    >
      <View style={styles.toast}>
        <View style={[styles.toastIcon, { backgroundColor: ok ? colors.accent : colors.bad }]}>
          <Icon name={ok ? 'check' : 'close'} size={15} color="#fff" stroke={3} />
        </View>
        <Text style={styles.toastText} numberOfLines={2}>
          {t.message}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ---------- 확인 창 ---------- */

const confirmListeners = new Set();
// confirmDialog({ title, message, confirmLabel, cancelLabel, danger, icon, onConfirm })
export function confirmDialog(options) {
  confirmListeners.forEach((l) => l(options));
}

export function ConfirmHost() {
  const [o, setO] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listener = (next) => {
      setO(next);
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start();
    };
    confirmListeners.add(listener);
    return () => confirmListeners.delete(listener);
  }, []);

  const close = (after) => {
    Animated.timing(anim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setO(null);
      if (after) after();
    });
  };

  if (!o) return null;
  const danger = o.danger !== false;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <Animated.View
        style={[
          styles.dialogWrap,
          { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }) },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} />
        <Animated.View
          style={[
            styles.dialog,
            { transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
          ]}
        >
          <Text style={styles.dialogTitle}>{o.title}</Text>
          {o.message ? <Text style={styles.dialogMsg}>{o.message}</Text> : null}
          <View style={styles.dialogBtns}>
            <Pressable
              onPress={() => close()}
              style={({ pressed }) => [styles.dialogBtn, pressed && { opacity: 0.5 }]}
              hitSlop={6}
            >
              <Text style={styles.dialogCancel}>{o.cancelLabel || '취소'}</Text>
            </Pressable>
            <Pressable
              onPress={() => close(o.onConfirm)}
              style={({ pressed }) => [styles.dialogBtn, pressed && { opacity: 0.5 }]}
              hitSlop={6}
            >
              <Text style={[styles.dialogOk, { color: danger ? colors.bad : colors.accent }]}>
                {o.confirmLabel || (danger ? '삭제' : '확인')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = themedStyles(() => ({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 },
  headerSide: { width: 96, minHeight: 40, justifyContent: 'center' },
  headerBtn: { width: 44, height: 40, justifyContent: 'center', paddingHorizontal: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: font.bold, fontSize: 17, color: colors.ink },
  headerSub: { fontFamily: font.regular, fontSize: 12, color: colors.inkFaint, marginTop: 1 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  iconBtnOn: { backgroundColor: colors.surfaceAlt },
  btn: {
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { fontFamily: font.semibold, fontSize: 15.5 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipText: { fontFamily: font.semibold, fontSize: 13.5, color: colors.inkSoft },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, ...shadow },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  sheetGrip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  sheetTitle: { fontFamily: font.bold, fontSize: 18, color: colors.ink, marginBottom: 8 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15 },
  sheetItemText: { fontFamily: font.semibold, fontSize: 15.5, color: colors.ink },
  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.ink, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontFamily: font.regular, fontSize: 13.5, color: colors.inkFaint, textAlign: 'center', lineHeight: 20 },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
  },
  pillBtnSolid: { backgroundColor: colors.accent },
  pillBtnText: { fontFamily: font.bold, fontSize: 14 },
  toastWrap: { position: 'absolute', left: 20, right: 20, bottom: 36, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    maxWidth: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    shadowColor: '#0B0E14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 10,
  },
  toastIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toastText: { flexShrink: 1, fontFamily: font.semibold, fontSize: 14.5, color: colors.ink },
  dialogWrap: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  dialog: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
  },
  dialogTitle: { fontFamily: font.bold, fontSize: 18, color: colors.ink, letterSpacing: -0.2 },
  dialogMsg: { fontFamily: font.regular, fontSize: 14.5, lineHeight: 22, color: colors.inkSoft, marginTop: 10 },
  dialogBtns: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, marginRight: -10 },
  dialogBtn: { paddingHorizontal: 16, height: 46, justifyContent: 'center' },
  dialogCancel: { fontFamily: font.semibold, fontSize: 15.5, color: colors.inkFaint },
  dialogOk: { fontFamily: font.bold, fontSize: 15.5 },
}));
