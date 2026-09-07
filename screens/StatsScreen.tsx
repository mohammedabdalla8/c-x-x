import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, ProgressBar, SectionTitle, StatTile, Txt } from '../components/ui';
import { Bars, Donut, Ring } from '../components/Charts';
import { useApp } from '../lib/store';
import { AR_DAYS_SHORT, formatDuration, toDateKey } from '../lib/format';
import { levelTitle } from '../lib/quotes';
import { PALETTE, ROW, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Stats'>;

export default function StatsScreen({ navigation }: Props) {
  const { theme, state, stats, levelInfo, week, weekMinutes, todayKey, topSubjectId } = useApp();

  const bars = useMemo(
    () =>
      week.map((w) => ({
        key: w.date,
        label: AR_DAYS_SHORT[new Date(`${w.date}T00:00:00`).getDay()],
        value: Math.round((w.minutes / 60) * 10) / 10,
      })),
    [week],
  );

  const segments = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const totals: Record<string, number> = {};
    Object.values(state.logs).forEach((l) => {
      if (new Date(`${l.date}T00:00:00`).getTime() < since.getTime()) return;
      Object.entries(l.subjectMinutes || {}).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    return Object.entries(totals)
      .map(([id, value]) => {
        const s = state.subjects.find((x) => x.id === id);
        return { key: id, value, color: s?.color || '#94A3B8', label: s?.name || 'مادة محذوفة' };
      })
      .filter((s) => s.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [state.logs, state.subjects]);

  const topSubject = state.subjects.find((s) => s.id === topSubjectId);
  const totalHours = stats.totalMinutes / 60;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="الإحصائيات" subtitle="كل رقم يحكي قصة التزامك" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[PALETTE.purple, '#6D5BF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 20 }}>
          <View style={{ flexDirection: ROW, gap: 18, alignItems: 'center' }}>
            <Ring progress={levelInfo.progress} size={104} stroke={11} color="#fff" track="rgba(255,255,255,0.25)">
              <Txt size={22} weight="x" color="#fff" align="center">
                {levelInfo.level}
              </Txt>
              <Txt size={10.5} weight="m" color="rgba(255,255,255,0.9)" align="center">
                المستوى
              </Txt>
            </Ring>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt size={16} weight="b" color="#fff">
                {levelTitle(levelInfo.level)}
              </Txt>
              <Txt size={12.5} weight="m" color="rgba(255,255,255,0.9)">
                {state.meta.points} نقطة • تبقى {levelInfo.toNext} للمستوى التالي
              </Txt>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                <View style={{ width: `${levelInfo.progress * 100}%`, height: '100%', backgroundColor: '#fff' }} />
              </View>
            </View>
          </View>
        </LinearGradient>

        <SectionTitle title="ساعات المذاكرة — آخر ٧ أيام" icon="bar-chart" />
        <Card>
          <Bars data={bars} todayKey={todayKey} formatter={(v) => `${v}`} />
          <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 14 }} />
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: PALETTE.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name="hourglass" size={18} color={PALETTE.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="b">
                {(weekMinutes / 60).toFixed(1)} ساعة هذا الأسبوع
              </Txt>
              <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                بمعدل {((weekMinutes / 60) / 7).toFixed(1)} ساعة يومياً
              </Txt>
            </View>
          </View>
        </Card>

        <SectionTitle title="توزيع المذاكرة على المواد (٣٠ يوم)" icon="pie-chart" color={PALETTE.teal} />
        <Card>
          {segments.length === 0 ? (
            <Txt size={13} color={theme.subtext} align="center" style={{ paddingVertical: 16 }}>
              سجّل جلساتك لعرض التوزيع هنا
            </Txt>
          ) : (
            <View style={{ flexDirection: ROW, gap: 16, alignItems: 'center' }}>
              <Donut
                segments={segments}
                size={128}
                stroke={17}
                centerValue={`${(segments.reduce((a, s) => a + s.value, 0) / 60).toFixed(0)} س`}
                centerLabel="إجمالي"
              />
              <View style={{ flex: 1, gap: 8 }}>
                {segments.map((s) => (
                  <View key={s.key} style={{ flexDirection: ROW, alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
                    <Txt size={12} weight="s" style={{ flex: 1 }} numberOfLines={1}>
                      {s.label}
                    </Txt>
                    <Txt size={11.5} color={theme.subtext} weight="m">
                      {(s.value / 60).toFixed(1)} س
                    </Txt>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>

        <SectionTitle title="أرقامك" icon="stats-chart" color={PALETTE.amber} />
        <View style={{ flexDirection: ROW, gap: 10, marginBottom: 10 }}>
          <StatTile icon="hourglass" label="إجمالي الساعات" value={totalHours.toFixed(1)} color={PALETTE.primary} />
          <StatTile icon="timer" label="جلسات بومودورو" value={stats.pomodoros} color={PALETTE.teal} />
        </View>
        <View style={{ flexDirection: ROW, gap: 10, marginBottom: 10 }}>
          <StatTile icon="checkmark-done" label="دروس مكتملة" value={stats.lessonsDone} color={PALETTE.green} />
          <StatTile icon="flame" label="أطول سلسلة" value={`${stats.bestStreak} يوم`} color={PALETTE.amber} />
        </View>
        <View style={{ flexDirection: ROW, gap: 10 }}>
          <StatTile icon="sparkles" label="متوسط التركيز" value={stats.focusAvg ? stats.focusAvg.toFixed(1) : '—'} color={PALETTE.purple} />
          <StatTile icon="calendar" label="أيام سجّلت فيها" value={stats.daysLogged} color={PALETTE.sky} />
        </View>

        <SectionTitle title="أكثر مادة درستها" icon="trophy" color={PALETTE.rose} />
        <Card>
          {topSubject ? (
            <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${topSubject.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={topSubject.icon} size={23} color={topSubject.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={15} weight="b">
                  {topSubject.name}
                </Txt>
                <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
                  أكثر من {formatDuration(Object.values(state.logs).reduce((a, l) => a + (l.subjectMinutes?.[topSubject.id] || 0), 0))} مذاكرة
                </Txt>
              </View>
              <SIcon name="trophy" size={24} color={PALETTE.amber} />
            </View>
          ) : (
            <Txt size={13} color={theme.subtext} align="center">
              ابدأ المذاكرة ليظهر مادتك الأكثر دراسة
            </Txt>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
