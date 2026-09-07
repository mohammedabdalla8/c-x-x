import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { Card, PrimaryButton, SectionTitle, Sheet, Stepper, ToggleRow, Txt } from '../components/ui';
import { Ring } from '../components/Charts';
import { useApp } from '../lib/store';
import { formatDuration } from '../lib/format';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { Routine } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Focus'>;

interface PomoSettings {
  focus: number;
  short: number;
  long: number;
  rounds: number;
  autoBreaks: boolean;
}

const DEFAULT_POMO: PomoSettings = { focus: 25, short: 5, long: 15, rounds: 4, autoBreaks: true };

export default function PomodoroScreen({ navigation, route }: Props) {
  const { theme, state, todayLog } = useApp();
  const [sheet, setSheet] = useState(false);
  const [settings, setSettings] = useState<PomoSettings>(DEFAULT_POMO);
  const [subjectId, setSubjectId] = useState<string | undefined>(route.params?.subjectId || state.subjects[0]?.id);
  const doneToday = todayLog.pomodoros;
  const pending = state.lessons.filter((l) => !l.done && (!subjectId || l.subjectId === subjectId));
  const subject = state.subjects.find((s) => s.id === subjectId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Txt size={22} weight="x">
          جلسات التركيز
        </Txt>
        <Txt size={13} color={theme.subtext} style={{ marginTop: 4 }}>
          بومودورو: ٢٥ دقيقة تركيز • ٥ دقائق راحة • راحة طويلة بعد كل {settings.rounds} جلسات
        </Txt>

        <LinearGradient
          colors={[PALETTE.teal, '#0E9C8C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 28, padding: 24, marginTop: 18, alignItems: 'center' }}
        >
          <Ring progress={0} size={148} stroke={13} color="#fff" track="rgba(255,255,255,0.25)">
            <Txt size={34} weight="x" color="#fff" align="center">
              {settings.focus}
            </Txt>
            <Txt size={12} weight="m" color="rgba(255,255,255,0.9)" align="center">
              دقائق تركيز
            </Txt>
          </Ring>
          <View style={{ flexDirection: ROW, gap: 14, marginTop: 18 }}>
            <Dot label={`${settings.short} د راحة`} icon="cafe" />
            <Dot label={`${settings.long} د راحة طويلة`} icon="moon" />
            <Dot label={`${settings.rounds} جلسات`} icon="repeat" />
          </View>
          <View style={{ width: '100%', marginTop: 20 }}>
            <PrimaryButton
              label="ابدأ جلسة التركيز"
              icon="play"
              onPress={() => navigation.navigate('Focus', { subjectId, lessonId: pending[0]?.id })}
            />
          </View>
          <Pressable onPress={() => setSheet(true)} style={{ marginTop: 12 }}>
            <Txt size={12.5} weight="s" color="#fff">
              تخصيص مدد الجلسات ⚙️
            </Txt>
          </Pressable>
        </LinearGradient>

        <Card level={2} style={{ marginTop: 16 }}>
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: PALETTE.amberSoft, alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name="flame" size={24} color={PALETTE.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="b">
                {doneToday} جلسة منجزة اليوم
              </Txt>
              <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
                كل جلسة = {12} نقاط + نقاط التركيز
              </Txt>
            </View>
          </View>
          <View style={{ flexDirection: ROW, gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {Array.from({ length: Math.max(settings.rounds, Math.min(doneToday, 12)) }).map((_, i) => (
              <View key={i} style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: i < doneToday ? PALETTE.teal : theme.mode === 'dark' ? '#232B4A' : '#EEF1F8', alignItems: 'center', justifyContent: 'center' }}>
                {i < doneToday ? <SIcon name="checkmark" size={14} color="#fff" /> : null}
              </View>
            ))}
          </View>
        </Card>

        <SectionTitle title="اختر المادة" icon="albums" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
          {state.subjects.map((s) => {
            const active = s.id === subjectId;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSubjectId(s.id)}
                style={{
                  flexDirection: ROW,
                  alignItems: 'center',
                  gap: 7,
                  paddingHorizontal: 13,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: active ? s.color : theme.card,
                  borderWidth: 1,
                  borderColor: active ? s.color : theme.border,
                }}
              >
                <SIcon name={s.icon} size={15} color={active ? '#fff' : s.color} />
                <Txt size={12.5} weight="s" color={active ? '#fff' : theme.subtext}>
                  {s.name}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        {pending.length > 0 ? (
          <>
            <SectionTitle title="الدرس التالي" icon="bookmark" />
            <Card>
              <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: (subject?.color || PALETTE.primary) + '1F', alignItems: 'center', justifyContent: 'center' }}>
                  <SIcon name="book" size={20} color={subject?.color || PALETTE.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={14} weight="b" numberOfLines={2}>
                    {pending[0].title}
                  </Txt>
                  <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                    {subject?.name} • {formatDuration(pending[0].estMinutes)}
                  </Txt>
                </View>
              </View>
            </Card>
          </>
        ) : null}

        <SectionTitle title="كيف يعمل بومودورو؟" icon="help-circle" color={PALETTE.purple} />
        <Card>
          {[
            { n: '١', t: 'اختر مادة ودرس واحداً للجلسة القادمة', i: 'albums' },
            { n: '٢', t: `ركّز ${settings.focus} دقائق كاملة دون أي إشعارات`, i: 'timer' },
            { n: '٣', t: `استرح ${settings.short} دقائق ثم ارجع أقوى`, i: 'cafe' },
            { n: '٤', t: `بعد ${settings.rounds} جلسات استراحة طويلة ${settings.long} دقيقة`, i: 'moon' },
          ].map((r) => (
            <View key={r.n} style={{ flexDirection: ROW, gap: 12, alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 11, backgroundColor: PALETTE.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={r.i} size={16} color={PALETTE.purple} />
              </View>
              <Txt size={13} weight="m" style={{ flex: 1 }}>
                {r.t}
              </Txt>
            </View>
          ))}
        </Card>
      </ScrollView>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="تخصيص نظام البومودورو">
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={settings.focus} onChange={(v) => setSettings((s) => ({ ...s, focus: v }))} step={5} min={10} max={90} format={(v) => `${v} دقيقة تركيز`} />
        </Card>
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={settings.short} onChange={(v) => setSettings((s) => ({ ...s, short: v }))} step={5} min={3} max={30} format={(v) => `${v} راحة قصيرة`} />
        </Card>
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={settings.long} onChange={(v) => setSettings((s) => ({ ...s, long: v }))} step={5} min={10} max={60} format={(v) => `${v} راحة طويلة`} />
        </Card>
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={settings.rounds} onChange={(v) => setSettings((s) => ({ ...s, rounds: v }))} step={1} min={2} max={8} format={(v) => `${v} جلسات`} />
        </Card>
        <Card style={{ paddingVertical: 6 }}>
          <ToggleRow icon="play-circle" title="بدء الراحة تلقائياً" desc="ينتقل للراحة فور انتهاء التركيز" value={settings.autoBreaks} onChange={(v) => setSettings((s) => ({ ...s, autoBreaks: v }))} />
        </Card>
        <PrimaryButton
          label="حفظ وبدء جلسة"
          icon="checkmark"
          style={{ marginTop: 18 }}
          onPress={() => {
            setSheet(false);
            navigation.navigate('Focus', { subjectId, lessonId: pending[0]?.id });
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function Dot({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 }}>
      <SIcon name={icon} size={13} color="#fff" />
      <Txt size={11.5} weight="s" color="#fff">
        {label}
      </Txt>
    </View>
  );
}
