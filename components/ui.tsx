import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../lib/store';
import { CHEVRON_BACK, F, ROW, RADIUS, SPACING, TXT_RIGHT, shadow } from '../lib/theme';
import { SIcon } from './SIcon';

export function Card({
  children,
  style,
  onPress,
  level = 1,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  level?: 1 | 2 | 3;
}) {
  const { theme } = useApp();
  const base: ViewStyle = {
    backgroundColor: theme.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    ...shadow(level),
  };
  if (!onPress) return <View style={[base, style as ViewStyle]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [base, style as ViewStyle, pressed && { opacity: 0.88, transform: [{ scale: 0.995 }] }]}
    >
      {children}
    </Pressable>
  );
}

export function Txt({
  children,
  size = 14,
  weight = 'r',
  color,
  style,
  numberOfLines,
  align,
}: {
  children: React.ReactNode;
  size?: number;
  weight?: 'r' | 'm' | 's' | 'b' | 'x';
  color?: string;
  style?: ViewStyle | any;
  numberOfLines?: number;
  align?: 'right' | 'left' | 'center';
}) {
  const { theme } = useApp();
  const fam = { r: F.r, m: F.m, s: F.s, b: F.b, x: F.x }[weight];
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fam, fontSize: size, color: color || theme.text, textAlign: align || TXT_RIGHT, writingDirection: 'rtl' }, style]}
    >
      {children}
    </Text>
  );
}

export function Row({ children, style, gap = 8 }: { children: React.ReactNode; style?: ViewStyle; gap?: number }) {
  return <View style={[{ flexDirection: ROW, alignItems: 'center', gap }, style]}>{children}</View>;
}

export function AppHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { theme } = useApp();
  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md, flexDirection: ROW, alignItems: 'center', gap: 12 }}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name={CHEVRON_BACK as never} size={20} color={theme.text} />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        <Txt size={20} weight="b">
          {title}
        </Txt>
        {subtitle ? (
          <Txt size={12.5} color={theme.subtext} weight="m" style={{ marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  title,
  icon,
  actionLabel,
  onAction,
  color,
}: {
  title: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: string;
}) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.lg, marginBottom: SPACING.sm }}>
      <View style={{ flexDirection: ROW, alignItems: 'center', gap: 8 }}>
        {icon ? <SIcon name={icon} size={18} color={color || theme.primary} /> : null}
        <Txt size={16} weight="b">
          {title}
        </Txt>
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Txt size={13} weight="s" color={theme.primary}>
            {actionLabel}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  color,
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  color?: string;
  style?: ViewStyle;
  small?: boolean;
}) {
  const { theme, haptic } = useApp();
  const c1 = color || theme.primary;
  const c2 = color ? color : theme.mode === 'dark' ? '#6C78FF' : '#4653E0';
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        haptic('light');
        onPress?.();
      }}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] }, style as ViewStyle]}
    >
      <LinearGradient
        colors={[c1, c2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flexDirection: ROW,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: small ? 10 : 15,
          paddingHorizontal: small ? 14 : 20,
          borderRadius: RADIUS.md,
          ...shadow(2),
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {icon ? <Ionicons name={icon as never} size={small ? 16 : 19} color="#fff" /> : null}
            <Text style={{ color: '#fff', fontFamily: F.b, fontSize: small ? 13.5 : 15.5 }}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function SoftButton({
  label,
  onPress,
  icon,
  tone = 'primary',
  style,
  small,
}: {
  label: string;
  onPress?: () => void;
  icon?: string;
  tone?: 'primary' | 'danger' | 'muted' | 'success';
  style?: ViewStyle;
  small?: boolean;
}) {
  const { theme, haptic } = useApp();
  const map = {
    primary: { bg: theme.primarySoft, fg: theme.primary },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    muted: { bg: theme.mode === 'dark' ? '#1D2440' : '#F1F3FA', fg: theme.subtext },
    success: { bg: theme.successSoft, fg: theme.success },
  }[tone];
  return (
    <Pressable
      onPress={() => {
        haptic('light');
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          flexDirection: ROW,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          backgroundColor: map.bg,
          paddingVertical: small ? 8 : 12,
          paddingHorizontal: small ? 12 : 16,
          borderRadius: RADIUS.md,
          opacity: pressed ? 0.85 : 1,
        },
        style as ViewStyle,
      ]}
    >
      {icon ? <Ionicons name={icon as never} size={small ? 15 : 18} color={map.fg} /> : null}
      <Text style={{ color: map.fg, fontFamily: F.s, fontSize: small ? 12.5 : 14 }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  tone = 'primary',
  size = 18,
  box = 40,
}: {
  icon: string;
  onPress?: () => void;
  tone?: 'primary' | 'danger' | 'muted' | 'success' | 'warn';
  size?: number;
  box?: number;
}) {
  const { theme, haptic } = useApp();
  const map = {
    primary: { bg: theme.primarySoft, fg: theme.primary },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    muted: { bg: theme.mode === 'dark' ? '#1D2440' : '#F1F3FA', fg: theme.subtext },
    success: { bg: theme.successSoft, fg: theme.success },
    warn: { bg: theme.warnSoft, fg: theme.warn },
  }[tone];
  return (
    <Pressable
      onPress={() => {
        haptic('light');
        onPress?.();
      }}
      style={({ pressed }) => ({
        width: box,
        height: box,
        borderRadius: box / 2,
        backgroundColor: map.bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <SIcon name={icon} size={size} color={map.fg} />
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
}) {
  const { theme } = useApp();
  const c = color || theme.primary;
  return (
    <Pressable
      onPress={() => {
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: ROW,
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: RADIUS.pill,
        backgroundColor: active ? c : theme.mode === 'dark' ? '#1B2240' : '#FFFFFF',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: active ? c : theme.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? <SIcon name={icon} size={15} color={active ? '#fff' : theme.subtext} /> : null}
      <Text style={{ fontFamily: F.s, fontSize: 13, color: active ? '#fff' : theme.subtext }}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({
  value,
  color,
  height = 10,
  track,
}: {
  value: number;
  color?: string;
  height?: number;
  track?: string;
}) {
  const { theme } = useApp();
  const pct = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track || (theme.mode === 'dark' ? '#232B4A' : '#EDF0F8'), overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color || theme.primary, borderRadius: height / 2 }} />
    </View>
  );
}

export function StatTile({
  icon,
  label,
  value,
  color,
  suffix,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  suffix?: string;
}) {
  const { theme } = useApp();
  return (
    <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: RADIUS.md, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, ...shadow(1) }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: `${color}1F`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <SIcon name={icon} size={18} color={color} />
      </View>
      <Txt size={18} weight="b">
        {value}
        {suffix ? <Txt size={11.5} weight="m" color={theme.subtext}> {suffix}</Txt> : null}
      </Txt>
      <Txt size={11.5} color={theme.subtext} weight="m" numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  actionLabel,
  onAction,
}: {
  icon: string;
  title: string;
  desc?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { theme } = useApp();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <SIcon name={icon} size={34} color={theme.primary} />
      </View>
      <Txt size={16} weight="b" align="center">
        {title}
      </Txt>
      {desc ? (
        <Txt size={13} color={theme.subtext} align="center" style={{ marginTop: 6, lineHeight: 21 }}>
          {desc}
        </Txt>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 16 }}>
          <PrimaryButton label={actionLabel} onPress={onAction} small />
        </View>
      ) : null}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 999,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
}) {
  const { theme } = useApp();
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v * 100) / 100));
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 10 }}>
      <IconButton icon="remove" tone="muted" size={16} box={34} onPress={() => onChange(clamp(value - step))} />
      <Text style={{ fontFamily: F.b, fontSize: 14.5, color: theme.text, minWidth: 62, textAlign: 'center' }}>
        {format ? format(value) : value}
      </Text>
      <IconButton icon="add" tone="primary" size={16} box={34} onPress={() => onChange(clamp(value + step))} />
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: ROW, backgroundColor: theme.mode === 'dark' ? '#1B2240' : '#EEF1F9', borderRadius: RADIUS.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, backgroundColor: active ? theme.card : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ fontFamily: active ? F.b : F.m, fontSize: 13, color: active ? theme.text : theme.subtext }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useApp();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'flex-end' }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: theme.bg,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: SPACING.lg,
            paddingTop: 12,
            paddingBottom: 28,
            maxHeight: '88%',
          }}
        >
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: theme.border, marginBottom: 12 }} />
          <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Txt size={17} weight="b">
              {title}
            </Txt>
            <IconButton icon="close" tone="muted" size={17} box={34} onPress={onClose} />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Input({
  style,
  ...props
}: TextInputProps & { style?: ViewStyle }) {
  const { theme } = useApp();
  return (
    <TextInput
      placeholderTextColor={theme.faint}
      {...props}
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: RADIUS.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
          paddingHorizontal: 14,
          paddingVertical: Platform.OS === 'ios' ? 14 : 11,
          fontFamily: F.m,
          fontSize: 14.5,
          color: theme.text,
          textAlign: TXT_RIGHT,
        },
        style as any,
      ]}
    />
  );
}

export function ToggleRow({
  icon,
  title,
  desc,
  value,
  onChange,
  color,
}: {
  icon: string;
  title: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  const { theme } = useApp();
  const c = color || theme.primary;
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={{ flexDirection: ROW, alignItems: 'center', gap: 12, paddingVertical: 12 }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: `${c}1F`, alignItems: 'center', justifyContent: 'center' }}>
        <SIcon name={icon} size={19} color={c} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={14.5} weight="s">
          {title}
        </Txt>
        {desc ? (
          <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
            {desc}
          </Txt>
        ) : null}
      </View>
      <View
        style={{
          width: 50,
          height: 30,
          borderRadius: 15,
          backgroundColor: value ? c : theme.mode === 'dark' ? '#2A3252' : '#E3E7F2',
          padding: 3,
          justifyContent: 'center',
          alignItems: value ? 'flex-end' : 'flex-start',
        }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
      </View>
    </Pressable>
  );
}

export function useSheet(): [boolean, () => void] {
  const [open, setOpen] = useState(false);
  return [open, () => setOpen((v) => !v)];
}
