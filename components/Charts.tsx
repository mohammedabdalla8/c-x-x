import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../lib/store';
import { F } from '../lib/theme';
import { Txt } from './ui';

export function Ring({
  progress,
  size = 120,
  stroke = 12,
  color,
  track,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const { theme } = useApp();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress || 0));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track || (theme.mode === 'dark' ? '#232B4A' : '#E9EDF8')} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color || theme.primary}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - p)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

export function Bars({
  data,
  height = 120,
  color,
  todayKey,
  formatter,
}: {
  data: { key: string; label: string; value: number }[];
  height?: number;
  color?: string;
  todayKey?: string;
  formatter?: (v: number) => string;
}) {
  const { theme } = useApp();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: height + 26 }}>
      {data.map((d) => {
        const isToday = d.key === todayKey;
        const h = Math.max(4, (d.value / max) * height);
        return (
          <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            {d.value > 0 ? (
              <Txt size={9.5} weight="s" color={isToday ? theme.primary : theme.faint}>
                {formatter ? formatter(d.value) : d.value}
              </Txt>
            ) : (
              <View style={{ height: 12 }} />
            )}
            <View
              style={{
                width: '100%',
                maxWidth: 26,
                height: h,
                borderRadius: 8,
                backgroundColor: isToday ? color || theme.primary : theme.mode === 'dark' ? '#2A3252' : '#DFE4F3',
              }}
            />
            <Txt size={10.5} weight={isToday ? 'b' : 'm'} color={isToday ? theme.primary : theme.subtext}>
              {d.label}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

export function Donut({
  segments,
  size = 130,
  stroke = 18,
  centerLabel,
  centerValue,
}: {
  segments: { key: string; value: number; color: string; label: string }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const { theme } = useApp();
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.mode === 'dark' ? '#232B4A' : '#EDF0F8'} strokeWidth={stroke} fill="none" />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <Circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += len;
          return el;
        })}
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Txt size={18} weight="b" align="center">
          {centerValue}
        </Txt>
        <Txt size={11} color={theme.subtext} align="center" weight="m">
          {centerLabel}
        </Txt>
      </View>
    </View>
  );
}

export const cairoFontStyle = { fontFamily: F.m };
