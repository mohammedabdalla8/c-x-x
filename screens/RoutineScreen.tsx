import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, PrimaryButton, Row, SectionTitle, SoftButton, Stepper, ToggleRow, Txt } from '../components/ui';
import { TimeField } from '../components/TimePicker';
import { useApp } from '../lib/store';
import { AR_DAYS_SHORT, formatDuration, formatTime } from '../lib/format';
import { availableStudyMinutes, generateDay } from '../lib/schedule';
import { defaultRoutine } from '../lib/presets';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { Branch, Grade, Routine } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Routine'>;

const PREVIEW_ICONS: Record<string, string> = {
  wake: 'sunny',
  study: 'book',
  meal: 'restaurant',
  exercise: 'fitness',
  rest: 'cafe',
  review: 'bulb',
  prep: 'bed',
  sleep: 'moon',
  free: 'happy',
};

export default function RoutineScreen({ navigation, route }: Props) {
  const { theme, state, completeOnboarding, updateRoutine, haptic } = useApp();
  const params = route.params;
  const edit = !params;
  const [busy, setBusy] = useState(false);
  const [routine, setRoutine] = useState<Routine>(edit ? state.routine : defaultRoutine());
  const [selectedDays, setSelectedDays] = useState<number[]>(routine.studyDays);

  const set = <K extends keyof Routine>(key: K, value: Routine[K]) => setRoutine((r) => ({ ...r, [key]: value }));

  const toggleDay = (d: number) => {
    haptic('light');
    setSelectedDays((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort();
      set('studyDays', next);
      return next;
    });
  };

  const preview = useMemo(() => generateDay(routine, [], [], new Date().getDay(), 'preview'), [routine]);
  const fit = availableStudyMinutes(routine) >= routine.studyHours * 60;

  const save = async () => {
    setBusy(true);
    const finalRoutine: Routine = { ...routine, studyDays: selectedDays };
    if (edit) {
      await updateRoutine(finalRoutine);
      setBusy(false);
      navigation.goBack();
    } else if (params) {
      await completeOnboarding({ name: params.name, grade: params.grade, branch: params.branch, routine: finalRoutine });
      setBusy(false);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <AppHeader
        title={edit ? 'تعديل الروتين اليومي' : 'اضبط روتينك اليومي'}
        subtitle="حدد أوقاتك وسنحوّلها إلى جدول ذكي كامل"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <SectionTitle title="الأساسيات" icon="alarm" />
        <TimeField label="موعد الاستيقاظ" value={routine.wakeUp} onChange={(v) => set('wakeUp', v)} icon="sunny" hint="نبدأ به حساب باقي يومك" />
        <TimeField label="موعد النوم" value={routine.sleep} onChange={(v) => set('sleep', v)} icon="moon" hint="سنمنع أي مذاكرة داخل وقت النوم" />
        <TimeField label="وقت بداية المذاكرة" value={routine.studyStart} onChange={(v) => set('studyStart', v)} icon="book" />
        <Card style={{ marginBottom: 10, paddingVertical: 16 }}>
          <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="s">
                عدد ساعات المذاكرة يومياً
              </Txt>
              <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                موزّعة على جلسات ٩٠ دقيقة مع راحات
              </Txt>
            </View>
            <Stepper value={routine.studyHours} onChange={(v) => set('studyHours', v)} step={0.5} min={1} max={10} format={(v) => `${v} ساعات`} />
          </View>
        </Card>

        <SectionTitle title="التمارين والراحة" icon="fitness" color={PALETTE.rose} />
        <TimeField label="موعد التمارين الرياضية" value={routine.exerciseTime} onChange={(v) => set('exerciseTime', v)} icon="fitness" />
        <Card style={{ marginBottom: 10, paddingVertical: 16 }}>
          <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="s">
                مدة التمارين
              </Txt>
            </View>
            <Stepper value={routine.exerciseDuration} onChange={(v) => set('exerciseDuration', v)} step={15} min={15} max={180} format={(v) => formatDuration(v)} />
          </View>
        </Card>
        <TimeField label="موعد الغداء" value={routine.lunchTime} onChange={(v) => set('lunchTime', v)} icon="restaurant" />
        <Card style={{ paddingVertical: 6 }}>
          <ToggleRow
            icon="bulb"
            title="مراجعة خفيفة قبل النوم"
            desc="جلسة ٣٠ دقيقة لترسيخ ما ذاكرته اليوم"
            value={routine.reviewEnabled}
            onChange={(v) => set('reviewEnabled', v)}
            color={PALETTE.purple}
          />
        </Card>

        <SectionTitle title="الأيام الدراسية" icon="calendar" color={PALETTE.teal} />
        <Card>
          <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {AR_DAYS_SHORT.map((d, i) => {
              const active = selectedDays.includes(i);
              const weekend = i === 5;
              return (
                <Pressable
                  key={d}
                  onPress={() => toggleDay(i)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderRadius: RADIUS.md,
                    backgroundColor: active ? theme.primary : weekend ? theme.mode === 'dark' ? '#232B4A' : '#F3F5FB' : theme.card,
                    borderWidth: 1.5,
                    borderColor: active ? theme.primary : theme.border,
                    minWidth: 46,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontFamily: active ? 'Cairo_700Bold' : 'Cairo_500Medium', color: active ? '#fff' : theme.subtext, fontSize: 13 }}>{d}</Text>
                </Pressable>
              );
            })}
          </View>
          <Txt size={11.5} color={theme.faint} align="center" style={{ marginTop: 12 }}>
            {selectedDays.length} أيام دراسة أسبوعياً — الأيام الأخرى ستكون راحة خفيفة
          </Txt>
        </Card>

        <SectionTitle title="معاينة الجدول" icon="eye" color={PALETTE.purple} />
        <Card level={2}>
          <View style={{ flexDirection: ROW, gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <Badge label={`${formatTime(routine.wakeUp)} استيقاظ`} color={PALETTE.amber} icon="sunny" />
            <Badge label={`${routine.studyHours} ساعات مذاكرة`} color={PALETTE.primary} icon="book" />
            <Badge label={`${formatTime(routine.exerciseTime)} رياضة`} color={PALETTE.rose} icon="fitness" />
            <Badge label={`${formatTime(routine.sleep)} نوم`} color="#6366F1" icon="moon" />
          </View>
          {preview.blocks.slice(0, 7).map((b) => (
            <View key={b.id} style={{ flexDirection: ROW, alignItems: 'center', gap: 10, paddingVertical: 7 }}>
              <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={PREVIEW_ICONS[b.type] || 'ellipse'} size={15} color={theme.primary} />
              </View>
              <Txt size={13} weight="m" style={{ flex: 1 }} numberOfLines={1}>
                {b.title}
              </Txt>
              <Txt size={12.5} weight="s" color={theme.subtext}>
                {formatTime(b.start)}
              </Txt>
            </View>
          ))}
          {!fit ? (
            <View style={{ marginTop: 12, flexDirection: ROW, gap: 8, backgroundColor: theme.dangerSoft, borderRadius: RADIUS.md, padding: 12 }}>
              <SIcon name="alert-circle" size={18} color={theme.danger} />
              <Txt size={12} color={theme.text} style={{ flex: 1, lineHeight: 20 }}>
                الوقت المتاح لا يكفي {routine.studyHours} ساعات — سنوزّع ما يمكن، أو قلّل ساعات النوم/التمارين قليلاً.
              </Txt>
            </View>
          ) : null}
        </Card>

        <View style={{ marginTop: 22, gap: 10 }}>
          <PrimaryButton
            label={edit ? 'حفظ التعديلات' : 'أنشئ خطتي الذكية ✨'}
            icon={edit ? 'checkmark' : 'sparkles'}
            loading={busy}
            disabled={selectedDays.length === 0}
            onPress={save}
          />
          {selectedDays.length === 0 ? (
            <Txt size={12} color={theme.danger} align="center">
              اختر يوماً دراسياً واحداً على الأقل
            </Txt>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ label, color, icon }: { label: string; color: string; icon: string }) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 6, backgroundColor: `${color}18`, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 }}>
      <SIcon name={icon} size={13} color={color} />
      <Txt size={11.5} weight="s" color={color === PALETTE.amber && theme.mode === 'dark' ? color : theme.text}>
        {label}
      </Txt>
    </View>
  );
}
