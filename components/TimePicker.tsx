import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/store';
import { formatTime } from '../lib/format';
import { F, ROW, RADIUS, TXT_RIGHT } from '../lib/theme';
import { Card, PrimaryButton, SoftButton, Txt } from './ui';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function Column({
  data,
  selected,
  onSelect,
  render,
}: {
  data: number[];
  selected: number;
  onSelect: (v: number) => void;
  render: (v: number) => string;
}) {
  const { theme } = useApp();
  return (
    <ScrollView
      style={{ flex: 1, maxHeight: 176 }}
      contentContainerStyle={{ paddingVertical: 66 }}
      showsVerticalScrollIndicator={false}
    >
      {data.map((v) => {
        const active = v === selected;
        return (
          <Pressable
            key={v}
            onPress={() => onSelect(v)}
            style={{
              paddingVertical: 9,
              marginVertical: 2,
              borderRadius: RADIUS.sm,
              alignItems: 'center',
              backgroundColor: active ? theme.primary : 'transparent',
            }}
          >
            <Txt size={active ? 19 : 16} weight={active ? 'b' : 'm'} color={active ? '#fff' : theme.subtext}>
              {render(v)}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  icon,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  icon?: string;
  hint?: string;
}) {
  const { theme } = useApp();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const openPicker = () => {
    setDraft(value);
    setOpen(true);
  };
  return (
    <>
      <Pressable onPress={openPicker} style={{ marginBottom: 10 }}>
        <Card style={{ paddingVertical: 14 }}>
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 12 }}>
            {icon ? (
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon as never} size={19} color={theme.primary} />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="s">
                {label}
              </Txt>
              {hint ? (
                <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                  {hint}
                </Txt>
              ) : null}
            </View>
            <Txt size={17} weight="b" color={theme.primary}>
              {formatTime(value)}
            </Txt>
            <Ionicons name="time-outline" size={20} color={theme.faint} />
          </View>
        </Card>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: theme.overlay, alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <View style={{ width: '100%', maxWidth: 420, backgroundColor: theme.bg, borderRadius: 26, padding: 20 }}>
            <Txt size={17} weight="b" align="center">
              {label}
            </Txt>
            {open ? (
              <TimeEditor
                key={`editor-${value}`}
                value={draft}
                onChange={setDraft}
                onConfirm={() => {
                  onChange(draft);
                  setOpen(false);
                }}
                onCancel={() => setOpen(false)}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

export function TimeEditor({
  value,
  onChange,
  onConfirm,
  onCancel,
}: {
  value: number;
  onChange: (v: number) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  const { theme } = useApp();
  const initial = useMemo(() => {
    const h24 = Math.floor(value / 60);
    const m = value % 60;
    return {
      hour12: h24 % 12 === 0 ? 12 : h24 % 12,
      minute: Math.round(m / 5) * 5 % 60,
      period: h24 < 12 ? 0 : 1,
    };
  }, [value]);
  const [hour, setHour] = useState(initial.hour12);
  const [minute, setMinute] = useState(initial.minute);
  const [period, setPeriod] = useState(initial.period);

  const commit = (h = hour, mi = minute, p = period) => {
    const h24 = p === 0 ? (h % 12) : (h % 12) + 12;
    onChange(h24 * 60 + mi);
  };

  return (
    <View style={{ marginTop: 14 }}>
      <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
        <View style={{ width: 108, height: 3, borderRadius: 2, backgroundColor: theme.border }} />
        <Txt size={26} weight="b" color={theme.primary}>
          {formatTime(period === 0 ? (hour % 12) * 60 + minute : ((hour % 12) + 12) * 60 + minute)}
        </Txt>
        <View style={{ width: 108, height: 3, borderRadius: 2, backgroundColor: theme.border }} />
      </View>
      <View style={{ flexDirection: ROW, gap: 10, height: 176 }}>
        <Column
          data={HOURS}
          selected={hour}
          onSelect={(v) => {
            setHour(v);
            commit(v, minute, period);
          }}
          render={(v) => `${v}`}
        />
        <Column
          data={MINUTES}
          selected={minute}
          onSelect={(v) => {
            setMinute(v);
            commit(hour, v, period);
          }}
          render={(v) => `${v < 10 ? '0' + v : v}`}
        />
        <Column
          data={[0, 1]}
          selected={period}
          onSelect={(v) => {
            setPeriod(v);
            commit(hour, minute, v);
          }}
          render={(v) => (v === 0 ? 'ص' : 'م')}
        />
      </View>
      <View style={{ flexDirection: ROW, gap: 10, marginTop: 16 }}>
        {onCancel ? <SoftButton label="إلغاء" onPress={onCancel} style={{ flex: 1 }} /> : null}
        <PrimaryButton label="تم" onPress={() => (onConfirm ? onConfirm() : commit())} style={{ flex: 1 }} icon="checkmark" />
      </View>
    </View>
  );
}
