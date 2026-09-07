import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, ProgressBar, SectionTitle, Txt } from '../components/ui';
import { TimelineItem } from '../components/Timeline';
import { useApp } from '../lib/store';
import { AR_DAYS, AR_DAYS_SHORT, formatDateShort, formatDuration, fromDateKey, nowMinutes, toDateKey } from '../lib/format';
import { plannedStudyMinutes } from '../lib/schedule';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Week'>;

export default function WeekScreen({ navigation, route }: Props) {
  const { theme, state, todayKey, todayLog, getBlocksForDate, completeBlock, uncompleteBlock } = useApp();
  const [selected, setSelected] = useState<string>(route.params?.date || todayKey);
  const now = nowMinutes();

  const days = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start.getTime() + i * 86400000);
      const key = toDateKey(day);
      const log = state.logs[key];
      const blocks = getBlocksForDate(key);
      const planned = blocks.filter((b) => b.type === 'study').reduce((a, b) => a + (b.end - b.start), 0);
      return { key, date: day, minutes: log?.studyMinutes || 0, planned, log, blocks };
    });
  }, [state.logs, getBlocksForDate]);

  const weekTotal = days.reduce((a, d) => a + d.minutes, 0);
  const weekPlanned = days.reduce((a, d) => a + d.planned, 0);
  const goalDays = days.filter((d) => d.planned > 0 && d.minutes >= d.planned).length;
  const day = days.find((d) => d.key === selected) || days[new Date().getDay()];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="الجدول الأسبوعي" subtitle="نظرة كاملة على أسبوعك الدراسي" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card level={2}>
          <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Txt size={12.5} color={theme.subtext} weight="m">
                إجمالي ساعات المذاكرة هذا الأسبوع
              </Txt>
              <Txt size={24} weight="x" style={{ marginTop: 2 }}>
                {(weekTotal / 60).toFixed(1)} <Txt size={13} weight="s" color={theme.subtext}>ساعة من {((weekPlanned / 60).toFixed(0))}</Txt>
              </Txt>
            </View>
            <View style={{ alignItems: 'center', backgroundColor: theme.successSoft, borderRadius: 18, padding: 14, minWidth: 84 }}>
              <Txt size={22} weight="x" color={theme.success}>
                {goalDays}
              </Txt>
              <Txt size={11} color={theme.success} weight="s" align="center">
                أيام بلغت الهدف
              </Txt>
            </View>
          </View>
          <ProgressBar value={weekPlanned ? weekTotal / weekPlanned : 0} color={theme.primary} height={9} />
        </Card>

        <SectionTitle title="اختر يوماً" icon="calendar" />
        <View style={{ flexDirection: ROW, gap: 8 }}>
          {days.map((d, i) => {
            const active = d.key === selected;
            const met = d.planned > 0 && d.minutes >= d.planned;
            const isToday = d.key === todayKey;
            return (
              <Pressable
                key={d.key}
                onPress={() => setSelected(d.key)}
                style={{
                  flex: 1,
                  borderRadius: RADIUS.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: active ? theme.primary : theme.card,
                  borderWidth: 1,
                  borderColor: active ? theme.primary : theme.border,
                }}
              >
                <Txt size={11} weight="s" color={active ? 'rgba(255,255,255,0.85)' : theme.subtext}>
                  {AR_DAYS_SHORT[i]}
                </Txt>
                <Txt size={13.5} weight="b" color={active ? '#fff' : theme.text}>
                  {d.date.getDate()}
                </Txt>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: met ? PALETTE.green : isToday ? (active ? '#fff' : theme.primary) : 'transparent' }} />
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title={`${AR_DAYS[day.date.getDay()]} • ${formatDateShort(day.date)}`} icon="list" />
        <Card style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Txt size={13} weight="s">
              {formatDuration(day.minutes)} مذاكرة
            </Txt>
            <Txt size={12} color={theme.subtext} weight="m">
              الهدف {formatDuration(day.planned)}
            </Txt>
          </View>
          <ProgressBar value={day.planned ? day.minutes / day.planned : 0} color={day.minutes >= day.planned && day.planned > 0 ? theme.success : theme.primary} height={8} />
        </Card>

        {day.blocks.length === 0 ? (
          <Card>
            <Txt size={13} color={theme.subtext} align="center">
              لا يوجد جدول لهذا اليوم
            </Txt>
          </Card>
        ) : (
          day.blocks.map((b) => {
            const isToday = day.key === todayKey;
            const done = isToday ? todayLog.completedBlockIds.includes(b.id) : (day.log?.completedBlockIds || []).includes(b.id);
            return (
              <TimelineItem
                key={b.id}
                block={b}
                done={done}
                isNow={isToday && now >= b.start && now < b.end}
                isPast={day.key < todayKey || (isToday && b.end <= now)}
                onToggle={
                  isToday
                    ? () => (done ? uncompleteBlock(b.id) : completeBlock(b))
                    : undefined
                }
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
