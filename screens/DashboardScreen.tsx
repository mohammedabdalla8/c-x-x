import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SIcon } from '../components/SIcon';
import { Card, Row, SectionTitle, SoftButton, Txt } from '../components/ui';
import { Ring } from '../components/Charts';
import { BLOCK_META, TimelineItem } from '../components/Timeline';
import { useApp } from '../lib/store';
import { AR_DAYS, formatDuration, formatDateLong, formatTime, minutesUntil, nowMinutes, toDateKey } from '../lib/format';
import { findReplacement } from '../lib/schedule';
import { quoteOfDay } from '../lib/quotes';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const QUICK = [
  { icon: 'timer', label: 'تركيز', color: PALETTE.teal, to: 'Focus' as const },
  { icon: 'calendar', label: 'جدولي', color: PALETTE.primary, to: 'Week' as const },
  { icon: 'albums', label: 'المواد', color: PALETTE.amber, to: 'Subjects' as const },
  { icon: 'flag', label: 'أهدافي', color: PALETTE.rose, to: 'Goals' as const },
];

export default function DashboardScreen({ navigation }: Props) {
  const { theme, state, todayKey, nowMin, todayLog, todayBlocks, dayStats, weekMinutes, stats, levelInfo, markSlept } = useApp();
  const profile = state.profile;
  const q = quoteOfDay(todayKey);
  const now = nowMinutes();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : 'مساء الخير';

  const suggestion = useMemo(
    () => findReplacement(state.routine, todayBlocks, todayLog.completedBlockIds, now),
    [state.routine, todayBlocks, todayLog.completedBlockIds, now],
  );

  const upcoming = todayBlocks.filter((b) => b.end > now).slice(0, 4);
  const showSleep = now >= state.routine.sleep - 60 || now < state.routine.wakeUp;
  const asleep = todayLog.sleptOnTime;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* greeting */}
        <View style={{ flexDirection: ROW, alignItems: 'center', marginTop: 8, marginBottom: 14 }}>
          <View style={{ flex: 1 }}>
            <Txt size={13} color={theme.subtext} weight="m">
              {greeting} 👋
            </Txt>
            <Txt size={22} weight="x">
              {profile?.name || 'طالب'}
            </Txt>
            <Txt size={12} color={theme.faint} style={{ marginTop: 2 }}>
              {formatDateLong(new Date())} • {AR_DAYS[new Date().getDay()]}
            </Txt>
          </View>
          <Pressable onPress={() => navigation.navigate('Profile')} style={{ alignItems: 'center' }}>
            <View style={{ width: 52, height: 52, borderRadius: 20, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: theme.primary }}>
              <Txt size={19} weight="x" color={theme.primary}>
                {(profile?.name || 'ط').trim().charAt(0)}
              </Txt>
            </View>
          </Pressable>
        </View>

        {/* hero */}
        <LinearGradient
          colors={[theme.primary, '#7C5BF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: 20, ...({} as object) }}
        >
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 18 }}>
            <Ring progress={dayStats.pct} size={104} stroke={11} color="#fff" track="rgba(255,255,255,0.25)">
              <Txt size={20} weight="x" color="#fff" align="center">
                {Math.round(dayStats.pct * 100)}%
              </Txt>
              <Txt size={10.5} weight="m" color="rgba(255,255,255,0.85)" align="center">
                إنجاز اليوم
              </Txt>
            </Ring>
            <View style={{ flex: 1, gap: 6 }}>
              <Txt size={12.5} weight="m" color="rgba(255,255,255,0.85)">
                ساعات المذاكرة
              </Txt>
              <Txt size={26} weight="x" color="#fff">
                {(dayStats.done / 60).toFixed(1)} / {state.routine.studyHours}
              </Txt>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(100, dayStats.pct * 100)}%`, height: '100%', backgroundColor: '#fff', borderRadius: 3 }} />
              </View>
              <Txt size={11.5} color="rgba(255,255,255,0.85)" weight="m">
                {dayStats.blocksDone} من {dayStats.blocksTotal} موعداً منجزاً اليوم
              </Txt>
            </View>
          </View>

          {dayStats.next ? (
            <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.md, padding: 14, flexDirection: ROW, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={BLOCK_META[dayStats.next.type].icon} size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={11.5} weight="m" color="rgba(255,255,255,0.85)">
                  الموعد القادم
                </Txt>
                <Txt size={14.5} weight="b" color="#fff" numberOfLines={1}>
                  {dayStats.next.title}
                </Txt>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Txt size={13} weight="b" color="#fff">
                  {formatTime(dayStats.next.start)}
                </Txt>
                <Txt size={10.5} weight="m" color="rgba(255,255,255,0.9)">
                  {minutesUntil(dayStats.next.start, now) <= 0 ? 'بدأ الآن' : `بعد ${formatDuration(minutesUntil(dayStats.next.start, now))}`}
                </Txt>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.md, padding: 14, alignItems: 'center' }}>
              <Txt size={13} weight="s" color="#fff" align="center">
                {todayBlocks.length === 0 ? 'لا يوجد جدول لهذا اليوم' : 'أنجزت كل مواعيد اليوم — أحسنت! 🎉'}
              </Txt>
            </View>
          )}

          <View style={{ flexDirection: ROW, gap: 10, marginTop: 14 }}>
            <Pressable
              onPress={() => navigation.navigate('Focus')}
              style={{ flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', flexDirection: ROW, justifyContent: 'center', gap: 7 }}
            >
              <Ionicons name="timer" size={17} color={theme.primary} />
              <Txt size={13.5} weight="b" color={theme.primary}>
                ابدأ التركيز
              </Txt>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Main', { screen: 'TodayTab' })}
              style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', flexDirection: ROW, justifyContent: 'center', gap: 7 }}
            >
              <Ionicons name="list" size={17} color="#fff" />
              <Txt size={13.5} weight="b" color="#fff">
                جدولي اليوم
              </Txt>
            </Pressable>
          </View>
        </LinearGradient>

        {/* quick actions */}
        <View style={{ flexDirection: ROW, gap: 10, marginTop: 16 }}>
          {QUICK.map((q2) => (
            <Pressable
              key={q2.label}
              onPress={() => {
                if (q2.to === 'Week' || q2.to === 'Focus') navigation.navigate(q2.to as never);
                else navigation.navigate(q2.to as never);
              }}
              style={{ flex: 1, backgroundColor: theme.card, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', gap: 7, borderWidth: 1, borderColor: theme.border }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: `${q2.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={q2.icon} size={19} color={q2.color} />
              </View>
              <Txt size={11.5} weight="s">
                {q2.label}
              </Txt>
            </Pressable>
          ))}
        </View>

        {/* missed session suggestion */}
        {suggestion ? (
          <Card level={2} style={{ marginTop: 16, borderColor: theme.warn, borderWidth: 1.4 }}>
            <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
              <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: theme.warnSoft, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name="bulb" size={21} color={theme.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="b">
                  اقتراح ذكي لتعويض جلسة
                </Txt>
                <Txt size={12} color={theme.subtext} style={{ marginTop: 3, lineHeight: 19 }}>
                  {suggestion.reason}
                </Txt>
                <Txt size={12.5} weight="b" color={theme.warn} style={{ marginTop: 5 }}>
                  {formatTime(suggestion.start)} — {formatTime(suggestion.end)} ({formatDuration(suggestion.end - suggestion.start)})
                </Txt>
              </View>
            </View>
            <View style={{ flexDirection: ROW, gap: 10, marginTop: 14 }}>
              <SoftButton
                label="أضف لجدولي"
                icon="add"
                tone="primary"
                small
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('Main', { screen: 'TodayTab' })}
              />
              <SoftButton label="لاحقاً" tone="muted" small onPress={() => {}} />
            </View>
          </Card>
        ) : null}

        {/* stats */}
        <SectionTitle title="نبض اليوم والأسبوع" icon="stats-chart" onAction={() => navigation.navigate('Stats')} actionLabel="التفاصيل" />
        <Card>
          <View style={{ flexDirection: ROW, gap: 8 }}>
            <MiniStat icon="hourglass" value={`${(weekMinutes / 60).toFixed(1)}`} label="ساعات هذا الأسبوع" color={PALETTE.primary} />
            <MiniStat icon="flame" value={`${stats.streak}`} label="سلسلة الالتزام" color={PALETTE.amber} />
          </View>
          <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 12 }} />
          <View style={{ flexDirection: ROW, gap: 8 }}>
            <MiniStat icon="timer" value={`${state.meta.pomodoros}`} label="جلسات تركيز" color={PALETTE.teal} />
            <MiniStat icon="checkmark-done" value={`${state.meta.lessonsDone}`} label="دروس مكتملة" color={PALETTE.rose} />
          </View>
          <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 12 }} />
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: PALETTE.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name="ribbon" size={19} color={PALETTE.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={13} weight="s">
                المستوى {levelInfo.level} • {state.meta.points} نقطة
              </Txt>
              <View style={{ height: 6, backgroundColor: theme.mode === 'dark' ? '#232B4A' : '#EDF0F8', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}>
                <View style={{ width: `${levelInfo.progress * 100}%`, height: '100%', backgroundColor: PALETTE.purple }} />
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate('Achievements')} hitSlop={8}>
              <Txt size={12} weight="b" color={theme.primary}>
                الشارات
              </Txt>
            </Pressable>
          </View>
        </Card>

        {/* upcoming */}
        <SectionTitle title="بقي في يومك" icon="time" onAction={() => navigation.navigate('Main', { screen: 'TodayTab' })} actionLabel="عرض الكل" />
        <View>
          {upcoming.length === 0 ? (
            <Card>
              <Txt size={13} color={theme.subtext} align="center">
                انتهى يومك — نم مبكراً غداً بخطة أفضل 💪
              </Txt>
            </Card>
          ) : (
            upcoming.map((b, i) => (
              <TimelineItem
                key={b.id}
                block={b}
                done={todayLog.completedBlockIds.includes(b.id)}
                isNow={now >= b.start && now < b.end}
                isPast={b.end <= now}
                onToggle={undefined}
              />
            ))
          )}
        </View>

        {/* sleep */}
        {showSleep ? (
          <Card level={2} style={{ marginTop: 6 }}>
            <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: '#6366F11F', alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name="bed" size={22} color="#6366F1" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="b">
                  {asleep ? 'نمّت بالموعد — أحسنت! 🌙' : 'جاهز للنوم؟'}
                </Txt>
                <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
                  {asleep ? 'سجّلنا التزامك الليلة ونمنحك نقاطاً.' : `موعد نومك ${formatTime(state.routine.sleep)} — النوم الجيد ذاكرة أقوى.`}
                </Txt>
              </View>
              {!asleep ? <SoftButton label="نمت الآن" tone="primary" small icon="moon" onPress={markSlept} /> : null}
            </View>
          </Card>
        ) : null}

        {/* quote */}
        <View style={{ marginTop: 18, backgroundColor: theme.mode === 'dark' ? '#141A2E' : '#EEF1FF', borderRadius: RADIUS.lg, padding: 18, borderWidth: 1, borderColor: theme.border }}>
          <View style={{ flexDirection: ROW, gap: 10 }}>
            <SIcon name="sparkles" size={18} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Txt size={13.5} weight="s" style={{ lineHeight: 24 }}>
                “{q.text}”
              </Txt>
              <Txt size={11.5} color={theme.faint} style={{ marginTop: 6 }}>
                — {q.author}
              </Txt>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  const { theme } = useApp();
  return (
    <View style={{ flex: 1, flexDirection: ROW, alignItems: 'center', gap: 10 }}>
      <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${color}1F`, alignItems: 'center', justifyContent: 'center' }}>
        <SIcon name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt size={16} weight="b">
          {value}
        </Txt>
        <Txt size={11} color={theme.subtext} numberOfLines={1}>
          {label}
        </Txt>
      </View>
    </View>
  );
}
