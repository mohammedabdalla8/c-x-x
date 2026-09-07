import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../lib/store';
import { Block } from '../lib/types';
import { formatDuration, formatRange } from '../lib/format';
import { PALETTE, ROW } from '../lib/theme';
import { SIcon } from './SIcon';
import { Txt } from './ui';

export const BLOCK_META: Record<Block['type'], { icon: string; color: string }> = {
  sleep: { icon: 'moon', color: '#6366F1' },
  wake: { icon: 'sunny', color: PALETTE.amber },
  meal: { icon: 'restaurant', color: '#F97316' },
  study: { icon: 'book', color: PALETTE.primary },
  rest: { icon: 'cafe', color: PALETTE.teal },
  exercise: { icon: 'fitness', color: PALETTE.rose },
  review: { icon: 'bulb', color: PALETTE.purple },
  prep: { icon: 'bed', color: PALETTE.sky },
  free: { icon: 'happy', color: '#94A3B8' },
};

export function TimelineItem({
  block,
  done,
  isNow,
  isPast,
  onToggle,
  showDate,
}: {
  block: Block;
  done: boolean;
  isNow: boolean;
  isPast: boolean;
  onToggle?: () => void;
  showDate?: string;
}) {
  const { theme } = useApp();
  const meta = BLOCK_META[block.type];
  const tint = done ? theme.success : meta.color;
  return (
    <View style={{ flexDirection: ROW, gap: 12 }}>
      <View style={{ width: 62, paddingTop: 14, alignItems: 'center' }}>
        <Txt size={12.5} weight="b" color={isNow ? theme.primary : theme.subtext}>
          {formatRange(block.start, block.end).split(' — ')[0]}
        </Txt>
      </View>
      <View style={{ width: 26, alignItems: 'center' }}>
        <View
          style={{
            width: isNow ? 26 : 22,
            height: isNow ? 26 : 22,
            borderRadius: 13,
            backgroundColor: `${tint}${isNow ? '33' : '1F'}`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: isNow ? 2 : 0,
            borderColor: tint,
          }}
        >
          <SIcon name={meta.icon} size={isNow ? 14 : 12} color={tint} />
        </View>
        <View style={{ flex: 1, width: 2, backgroundColor: theme.divider, marginTop: 4, borderRadius: 2 }} />
      </View>
      <Pressable
        disabled={!onToggle}
        onPress={onToggle}
        style={({ pressed }) => ({
          flex: 1,
          backgroundColor: isNow ? theme.primarySoft : theme.card,
          borderRadius: 18,
          borderWidth: 1,
          borderStyle: isNow ? 'solid' : 'dashed',
          borderColor: isNow ? theme.primary : theme.border,
          padding: 14,
          marginBottom: 12,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <View style={{ flexDirection: ROW, alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Txt size={14.5} weight="b" numberOfLines={1} color={done ? theme.subtext : theme.text}>
              {block.title}
            </Txt>
            <Txt size={11.5} color={theme.subtext} weight="m" style={{ marginTop: 3 }}>
              {showDate ? `${showDate} • ` : ''}
              {formatDuration(block.end - block.start)}
            </Txt>
            {block.note ? (
              <Txt size={11.5} color={theme.faint} style={{ marginTop: 3 }} numberOfLines={2}>
                {block.note}
              </Txt>
            ) : null}
          </View>
          {onToggle ? (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: done ? theme.success : isPast ? theme.dangerSoft : theme.mode === 'dark' ? '#232B4A' : '#F1F3FA',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={done ? 'checkmark' : isPast ? 'alert' : 'ellipse-outline'}
                size={18}
                color={done ? '#fff' : isPast ? theme.danger : theme.faint}
              />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
