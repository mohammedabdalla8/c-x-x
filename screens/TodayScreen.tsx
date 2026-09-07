import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, EmptyState, Input, PrimaryButton, ProgressBar, SectionTitle, Sheet, SoftButton, Stepper, Txt } from '../components/ui';
import { TimelineItem } from '../components/Timeline';
import { useApp } from '../lib/store';
import { formatDateLong, formatDuration, formatTime, nowMinutes } from '../lib/format';
import { findReplacement } from '../lib/schedule';
import { PALETTE, ROW, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Today'>;

export default function TodayScreen({ navigation }: Props) {
  const { theme, state, todayKey, todayBlocks, todayLog, dayStats, completeBlock, uncompleteBlock, logSession, haptic } = useApp();
  const [sheet, setSheet] = useState(false);
  const [subjectId, setSubjectId] = useState<string | undefined>(state.subjects[0]?.id);
  const [minutes, setMinutes] = useState(60);
  const [note, setNote] = useState('');
  const now = nowMinutes();

  const suggestion = useMemo(
    () => findReplacement(state.routine, todayBlocks, todayLog.completedBlockIds, now),
    [state.routine, todayBlocks, todayLog.completedBlockIds, now],
  );

  const todayExams = state.exams.filter((e) => e.date === todayKey);
  const todayTasks = state.tasks.filter((t) => t.date === todayKey);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title="جدولي اليوم"
        subtitle={formatDateLong(new Date())}
        right={
          <Pressable onPress={() => navigation.navigate('Week')} style={{ backgroundColor: theme.primarySoft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
            <Txt size={12} weight="b" color={theme.primary}>
              الأسبوع
            </Txt>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card level={2}>
          <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Txt size={13} color={theme.subtext} weight="m">
                تقدّم اليوم
              </Txt>
              <Txt size={20} weight="b">
                {formatDuration(todayLog.studyMinutes)} من {formatDuration(dayStats.planned)}
              </Txt>
            </View>
            <View style={{ backgroundColor: theme.successSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 }}>
              <Txt size={12.5} weight="b" color={theme.success}>
                {Math.round(dayStats.pct * 100)}%
              </Txt>
            </View>
          </View>
          <ProgressBar value={dayStats.pct} color={theme.primary} height={10} />
          <View style={{ flexDirection: ROW, gap: 8, marginTop: 14 }}>
            <SoftButton label="إضافة جلسة" icon="add" tone="primary" small style={{ flex: 1 }} onPress={() => setSheet(true)} />
            <SoftButton label="المواد" icon="albums" tone="muted" small style={{ flex: 1 }} onPress={() => navigation.navigate('Subjects')} />
          </View>
        </Card>

        {todayExams.length > 0 ? (
          <Card style={{ marginTop: 12, borderColor: theme.danger, borderWidth: 1.2 }}>
            <View style={{ flexDirection: ROW, gap: 10, alignItems: 'center' }}>
              <SIcon name="ribbon" size={20} color={theme.danger} />
              <Txt size={13.5} weight="b" style={{ flex: 1 }}>
                لديك {todayExams.length} اختبار اليوم
              </Txt>
              <SoftButton label="التقويم" small tone="danger" onPress={() => navigation.navigate('Calendar')} />
            </View>
          </Card>
        ) : null}

        {todayTasks.length > 0 ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            {todayTasks.map((t) => (
              <Card key={t.id} style={{ paddingVertical: 12 }}>
                <View style={{ flexDirection: ROW, gap: 10, alignItems: 'center' }}>
                  <SIcon name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={t.done ? theme.success : theme.faint} />
                  <Txt size={13.5} weight="s" style={{ flex: 1 }}>
                    {t.title}
                  </Txt>
                </View>
              </Card>
            ))}
          </View>
        ) : null}

        {suggestion ? (
          <Card level={2} style={{ marginTop: 12, borderColor: theme.warn, borderWidth: 1.3 }}>
            <View style={{ flexDirection: ROW, gap: 10 }}>
              <SIcon name="bulb" size={20} color={theme.warn} />
              <View style={{ flex: 1 }}>
                <Txt size={13.5} weight="b">
                  جلسة تعويضية مقترحة
                </Txt>
                <Txt size={12} color={theme.subtext} style={{ marginTop: 4, lineHeight: 20 }}>
                  {suggestion.reason}
                </Txt>
                <Txt size={13} weight="b" color={theme.warn} style={{ marginTop: 6 }}>
                  {formatTime(suggestion.start)} — {formatTime(suggestion.end)}
                </Txt>
              </View>
            </View>
          </Card>
        ) : null}

        <SectionTitle title="الجدول الزمني" icon="time" />
        {todayBlocks.length === 0 ? (
          <EmptyState icon="calendar" title="لا يوجد جدول لليوم" desc="عد لإعداد الروتين من الإعدادات." actionLabel="الإعدادات" onAction={() => navigation.navigate('Settings')} />
        ) : (
          todayBlocks.map((b) => {
            const done = todayLog.completedBlockIds.includes(b.id);
            const isNow = now >= b.start && now < b.end;
            const isPast = b.end <= now;
            return (
              <TimelineItem
                key={b.id}
                block={b}
                done={done}
                isNow={isNow}
                isPast={isPast}
                onToggle={() => {
                  haptic('medium');
                  if (done) uncompleteBlock(b.id);
                  else completeBlock(b);
                }}
              />
            );
          })
        )}
      </ScrollView>

      <Sheet visible={sheet} onClose={() => setSheet(false)} title="تسجيل جلسة مذاكرة">
        <Txt size={12.5} color={theme.subtext} style={{ marginBottom: 12 }}>
          سجّل أي جلسة درستها خارج الجدول، وسيحتسبها في إحصائياتك ونِسَب التزامك.
        </Txt>
        <SectionTitle title="المادة" icon="albums" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {state.subjects.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSubjectId(s.id)}
              style={{
                paddingHorizontal: 13,
                paddingVertical: 9,
                borderRadius: 999,
                backgroundColor: subjectId === s.id ? s.color : theme.card,
                borderWidth: 1,
                borderColor: subjectId === s.id ? s.color : theme.border,
              }}
            >
              <Txt size={12.5} weight="s" color={subjectId === s.id ? '#fff' : theme.subtext}>
                {s.name}
              </Txt>
            </Pressable>
          ))}
        </View>
        <SectionTitle title="المدة الفعلية" icon="hourglass" />
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={minutes} onChange={setMinutes} step={15} min={15} max={360} format={(v) => formatDuration(v)} />
        </Card>
        <SectionTitle title="ملاحظة (اختياري)" icon="pencil" />
        <Input value={note} onChangeText={setNote} placeholder="مثال: حللت ٢٠ مسألة تفاضل" multiline />
        <PrimaryButton
          label="حفظ الجلسة"
          icon="checkmark"
          style={{ marginTop: 18 }}
          onPress={() => {
            logSession({ minutes, subjectId, focus: 4, completed: true, note: note || undefined, kind: 'manual' });
            setSheet(false);
            setNote('');
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}
