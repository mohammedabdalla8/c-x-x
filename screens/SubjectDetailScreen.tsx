import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, EmptyState, IconButton, Input, PrimaryButton, SectionTitle, Sheet, Stepper, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { formatDuration } from '../lib/format';
import { ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'SubjectDetail'>;

export default function SubjectDetailScreen({ navigation, route }: Props) {
  const { theme, state, addLesson, toggleLesson, deleteLesson, haptic } = useApp();
  const subject = state.subjects.find((s) => s.id === route.params.subjectId);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [est, setEst] = useState(45);

  const lessons = useMemo(() => state.lessons.filter((l) => l.subjectId === route.params.subjectId), [state.lessons, route.params.subjectId]);
  const done = lessons.filter((l) => l.done);
  const pending = lessons.filter((l) => !l.done);
  const estTotal = lessons.reduce((a, l) => a + l.estMinutes, 0);

  if (!subject) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
        <AppHeader title="المادة" onBack={() => navigation.goBack()} />
        <EmptyState icon="alert-circle" title="المادة غير موجودة" desc="ربما تم حذفها." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title={subject.name} subtitle={`${lessons.length} درساً • ${formatDuration(estTotal)} تقديرًا`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card level={2} style={{ backgroundColor: theme.card }}>
          <View style={{ flexDirection: ROW, gap: 14, alignItems: 'center' }}>
            <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: `${subject.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name={subject.icon} size={28} color={subject.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={17} weight="b">
                {subject.name}
              </Txt>
              <Txt size={12.5} color={theme.subtext} style={{ marginTop: 3 }}>
                {subject.hoursPerWeek} ساعات أسبوعياً • أولوية {subject.priority === 3 ? 'عالية' : subject.priority === 2 ? 'متوسطة' : 'منخفضة'}
              </Txt>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Txt size={22} weight="x" color={subject.color}>
                {lessons.length ? Math.round((done.length / lessons.length) * 100) : 0}%
              </Txt>
              <Txt size={11} color={theme.subtext}>
                مكتمل
              </Txt>
            </View>
          </View>
          <View style={{ marginTop: 16, flexDirection: ROW, gap: 10 }}>
            <PrimaryButton
              label="ابدأ مذاكرة هذه المادة"
              icon="timer"
              small
              color={subject.color}
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('Focus', { subjectId: subject.id, lessonId: pending[0]?.id })}
            />
            <PrimaryButton label="درس جديد" icon="add" small style={{ flex: 1 }} onPress={() => setOpen(true)} />
          </View>
        </Card>

        <SectionTitle title={`قيد المذاكرة (${pending.length})`} icon="book" color={subject.color} />
        {pending.length === 0 ? (
          <Card>
            <Txt size={13} color={theme.subtext} align="center">
              لا توجد دروس متبقية — أنهيت كل دروسك! 🎉
            </Txt>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {pending.map((l) => (
              <LessonRow key={l.id} id={l.id} title={l.title} est={l.estMinutes} done={false} accent={subject.color} onToggle={() => { haptic('success'); toggleLesson(l.id); }} onDelete={() => deleteLesson(l.id)} />
            ))}
          </View>
        )}

        <SectionTitle title={`مكتملة (${done.length})`} icon="checkmark-done" color={theme.success} />
        {done.length === 0 ? (
          <Card>
            <Txt size={13} color={theme.subtext} align="center">
              أنهِ درسك الأول وستظهر هنا ✓
            </Txt>
          </Card>
        ) : (
          <View style={{ gap: 10 }}>
            {done.map((l) => (
              <LessonRow key={l.id} id={l.id} title={l.title} est={l.estMinutes} done accent={subject.color} onToggle={() => toggleLesson(l.id)} onDelete={() => deleteLesson(l.id)} />
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={open} onClose={() => setOpen(false)} title="إضافة درس">
        <SectionTitle title="عنوان الدرس" icon="pencil" />
        <Input value={title} onChangeText={setTitle} placeholder="مثال: الفصل الثالث — الحركة الدورانية" returnKeyType="done" />
        <SectionTitle title="الوقت المتوقع" icon="hourglass" />
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={est} onChange={setEst} step={15} min={15} max={240} format={(v) => formatDuration(v)} />
        </Card>
        <PrimaryButton
          label="إضافة الدرس"
          icon="add"
          style={{ marginTop: 16 }}
          onPress={() => {
            if (!title.trim()) return;
            addLesson(subject.id, title.trim(), est);
            setTitle('');
            setOpen(false);
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function LessonRow({
  title,
  est,
  done,
  accent,
  onToggle,
  onDelete,
}: {
  id: string;
  title: string;
  est: number;
  done: boolean;
  accent: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { theme } = useApp();
  return (
    <Card style={{ paddingVertical: 12 }}>
      <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
        <Pressable onPress={onToggle} hitSlop={10}>
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: done ? theme.success : theme.mode === 'dark' ? '#232B4A' : '#F1F3FA', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name={done ? 'checkmark' : 'ellipse-outline'} size={17} color={done ? '#fff' : theme.faint} />
          </View>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Txt size={14} weight="s" color={done ? theme.subtext : theme.text} numberOfLines={2}>
            {title}
          </Txt>
          <Txt size={11.5} color={theme.faint} style={{ marginTop: 2 }}>
            {formatDuration(est)}
          </Txt>
        </View>
        <IconButton icon="trash" tone="muted" size={16} box={34} onPress={onDelete} />
      </View>
    </Card>
  );
}
