import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, Input, PrimaryButton, SectionTitle, Stepper, ToggleRow, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { formatDuration } from '../lib/format';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

const FOCUS_LEVELS = [
  { v: 1, label: 'متشتّت', icon: 'sad' },
  { v: 2, label: 'ضعيف', icon: 'sad-outline' },
  { v: 3, label: 'مقبول', icon: 'happy-outline' },
  { v: 4, label: 'جيد', icon: 'happy' },
  { v: 5, label: 'ممتاز', icon: 'rocket' },
];

export default function SessionSummaryScreen({ navigation, route }: Props) {
  const { theme, state, logSession } = useApp();
  const { minutes, subjectId, lessonId, pomodoros } = route.params;
  const [completed, setCompleted] = useState(true);
  const [focus, setFocus] = useState(4);
  const [actual, setActual] = useState(minutes);
  const [note, setNote] = useState('');
  const [subject, setSubject] = useState<string | undefined>(subjectId || state.subjects[0]?.id);

  const save = () => {
    logSession({ minutes: actual, subjectId: subject, lessonId, focus, completed, note: note || undefined, kind: 'pomodoro' });
    navigation.navigate('Main', { screen: 'FocusTab' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="ملخص الجلسة" subtitle="سجّل إنجازك لحظة بلحظة" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[PALETTE.teal, '#0E9C8C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 22, alignItems: 'center' }}>
          <Txt size={24} weight="x" color="#fff" align="center">
            أحسنت! 💪
          </Txt>
          <Txt size={13.5} weight="m" color="rgba(255,255,255,0.9)" align="center" style={{ marginTop: 6 }}>
            أنهيت جلسة تركيز لمدة {formatDuration(minutes)}
            {pomodoros > 0 ? ` • ${pomodoros} جلسات بومودورو` : ''}
          </Txt>
          <View style={{ flexDirection: ROW, gap: 10, marginTop: 16 }}>
            <Chip value={`+${completed ? 18 : 4} نقطة`} />
            <Chip value={`+${pomodoros * 12} تركيز`} />
          </View>
        </LinearGradient>

        <Card level={2} style={{ marginTop: 16, paddingVertical: 6 }}>
          <ToggleRow icon="checkmark-circle" title="هل أكملت الجلسة؟" desc="سنساعدك في التعويض إن لم تكمل" value={completed} onChange={setCompleted} color={PALETTE.teal} />
        </Card>

        <SectionTitle title="ماذا ذاكرت؟" icon="albums" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
          {state.subjects.map((s) => {
            const active = s.id === subject;
            return (
              <Pressable
                key={s.id}
                onPress={() => setSubject(s.id)}
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

        <SectionTitle title="عدد الساعات الفعلية" icon="hourglass" />
        <Card style={{ marginBottom: 6 }}>
          <Stepper value={actual} onChange={setActual} step={5} min={5} max={360} format={(v) => formatDuration(v)} />
        </Card>

        <SectionTitle title="مستوى التركيز" icon="sparkles" color={PALETTE.purple} />
        <View style={{ flexDirection: ROW, gap: 8 }}>
          {FOCUS_LEVELS.map((f) => {
            const active = f.v === focus;
            return (
              <Pressable
                key={f.v}
                onPress={() => setFocus(f.v)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 16,
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: active ? PALETTE.purple : theme.card,
                  borderWidth: 1,
                  borderColor: active ? PALETTE.purple : theme.border,
                }}
              >
                <SIcon name={f.icon} size={19} color={active ? '#fff' : theme.subtext} />
                <Txt size={10.5} weight="s" color={active ? '#fff' : theme.subtext}>
                  {f.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>

        <SectionTitle title="ملاحظة" icon="pencil" />
        <Input value={note} onChangeText={setNote} placeholder="مثال: أتقنت قانون الجيب والظل" multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />

        <PrimaryButton label="حفظ الإنجاز" icon="checkmark" style={{ marginTop: 22 }} onPress={save} />
        <Pressable onPress={save} style={{ marginTop: 14, alignItems: 'center' }}>
          <Txt size={13} color={theme.subtext} weight="s">
            تخطي وحفظ مختصر
          </Txt>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ value }: { value: string }) {
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 }}>
      <Txt size={12} weight="s" color="#fff">
        {value}
      </Txt>
    </View>
  );
}
