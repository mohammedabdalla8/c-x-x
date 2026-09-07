import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, EmptyState, IconButton, Input, PrimaryButton, SectionTitle, Sheet, Txt } from '../components/ui';
import { TimeEditor } from '../components/TimePicker';
import { useApp } from '../lib/store';
import { AR_DAYS, formatDateLong, formatDateShort, formatTime, toDateKey } from '../lib/format';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Calendar'>;

const COLS = ['سبت', 'أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع'];

export default function CalendarScreen({ navigation, route }: Props) {
  const { theme, state, todayKey, getBlocksForDate, addExam, deleteExam, addTask, toggleTask, deleteTask } = useApp();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string>(route.params?.date || todayKey);
  const [examSheet, setExamSheet] = useState(false);
  const [taskSheet, setTaskSheet] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState<string | undefined>(state.subjects[0]?.id);
  const [examTime, setExamTime] = useState(9 * 60);
  const [taskTitle, setTaskTitle] = useState('');

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 1) % 7; // السبت بداية

  const cells = useMemo(() => {
    const list: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysCount; d++) {
      list.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [year, month, daysCount, offset]);

  const statusOf = (key: string) => {
    const log = state.logs[key];
    const blocks = getBlocksForDate(key);
    const planned = blocks.filter((b) => b.type === 'study').reduce((a, b) => a + (b.end - b.start), 0);
    const exam = state.exams.some((e) => e.date === key);
    const task = state.tasks.some((t) => t.date === key && !t.done);
    let tone: 'done' | 'partial' | 'missed' | 'none' = 'none';
    if (planned > 0 && (log?.studyMinutes || 0) >= planned) tone = 'done';
    else if ((log?.studyMinutes || 0) > 0) tone = 'partial';
    else if (planned > 0 && key < todayKey) tone = 'missed';
    return { tone, exam, task, planned, minutes: log?.studyMinutes || 0 };
  };

  const toneColor = (tone: string) =>
    tone === 'done' ? theme.success : tone === 'partial' ? theme.warn : tone === 'missed' ? theme.danger : theme.mode === 'dark' ? '#1B2240' : '#FFFFFF';

  const selBlocks = getBlocksForDate(selected);
  const selExams = state.exams.filter((e) => e.date === selected);
  const selTasks = state.tasks.filter((t) => t.date === selected);
  const selStatus = statusOf(selected);
  const upcomingExams = state.exams.filter((e) => e.date >= todayKey).sort((a, b) => (a.date === b.date ? a.time - b.time : a.date < b.date ? -1 : 1)).slice(0, 5);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="التقويم" subtitle="جدولك، اختباراتك ومهامك في مكان واحد" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Card level={2}>
          <View style={{ flexDirection: ROW, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <IconButton icon="chevron-back" tone="muted" size={18} onPress={() => setCursor(new Date(year, month - 1, 1))} />
            <Txt size={16} weight="b">
              {['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][month]} {year}
            </Txt>
            <IconButton icon="chevron-forward" tone="muted" size={18} onPress={() => setCursor(new Date(year, month + 1, 1))} />
          </View>

          <View style={{ flexDirection: ROW, marginBottom: 8 }}>
            {COLS.map((c) => (
              <View key={c} style={{ flex: 1, alignItems: 'center' }}>
                <Txt size={11} weight="s" color={theme.faint}>
                  {c}
                </Txt>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: ROW, flexWrap: 'wrap' }}>
            {cells.map((key, i) => {
              if (!key) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 46 }} />;
              const st = statusOf(key);
              const isSelected = key === selected;
              const isToday = key === todayKey;
              const dayNum = Number(key.split('-')[2]);
              return (
                <Pressable key={key} onPress={() => setSelected(key)} style={{ width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 13,
                      backgroundColor: toneColor(st.tone),
                      borderWidth: isSelected ? 2 : isToday ? 1.5 : 0,
                      borderColor: isSelected ? theme.primary : isToday ? PALETTE.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Txt size={13} weight={isToday || isSelected ? 'b' : 'm'} color={st.tone === 'none' ? theme.text : '#fff'}>
                      {dayNum}
                    </Txt>
                  </View>
                  <View style={{ flexDirection: ROW, gap: 3, height: 6, marginTop: 1 }}>
                    {st.exam ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: theme.danger }} /> : null}
                    {st.task ? <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: PALETTE.sky }} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: ROW, gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <Legend color={theme.success} label="حقق الهدف" />
            <Legend color={theme.warn} label="جزئي" />
            <Legend color={theme.danger} label="لم يتم" />
            <Legend color={theme.danger} label="اختبار" small />
            <Legend color={PALETTE.sky} label="مهمة" small />
          </View>
        </Card>

        <SectionTitle title={formatDateLong(new Date(`${selected}T00:00:00`))} icon="today" color={PALETTE.primary} />
        <Card>
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt size={12.5} color={theme.subtext} weight="m">
                مذاكرة مخططة
              </Txt>
              <Txt size={16} weight="b" style={{ marginTop: 2 }}>
                {Math.round(selStatus.minutes / 60 * 10) / 10} / {Math.round(selStatus.planned / 60 * 10) / 10} ساعة
              </Txt>
            </View>
            <Pressable onPress={() => setExamSheet(true)} style={{ backgroundColor: theme.dangerSoft, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, flexDirection: ROW, gap: 6, alignItems: 'center' }}>
              <SIcon name="add" size={15} color={theme.danger} />
              <Txt size={12} weight="s" color={theme.danger}>
                اختبار
              </Txt>
            </Pressable>
            <Pressable onPress={() => setTaskSheet(true)} style={{ backgroundColor: `${PALETTE.sky}1F`, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, flexDirection: ROW, gap: 6, alignItems: 'center' }}>
              <SIcon name="add" size={15} color={PALETTE.sky} />
              <Txt size={12} weight="s" color={PALETTE.sky}>
                مهمة
              </Txt>
            </Pressable>
          </View>
        </Card>

        {selExams.length > 0 ? (
          <>
            <SectionTitle title="اختبارات اليوم" icon="ribbon" color={theme.danger} />
            <View style={{ gap: 10 }}>
              {selExams.map((e) => {
                const s = state.subjects.find((x) => x.id === e.subjectId);
                return (
                  <Card key={e.id} style={{ borderColor: theme.danger, borderWidth: 1.2, paddingVertical: 12 }}>
                    <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: theme.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
                        <SIcon name="ribbon" size={19} color={theme.danger} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt size={14} weight="b">
                          {e.title}
                        </Txt>
                        <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                          {formatTime(e.time)}{s ? ` • ${s.name}` : ''}
                        </Txt>
                      </View>
                      <IconButton icon="trash" tone="muted" size={16} box={34} onPress={() => deleteExam(e.id)} />
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        ) : null}

        {selTasks.length > 0 ? (
          <>
            <SectionTitle title="مهام اليوم" icon="checkbox" color={PALETTE.sky} />
            <View style={{ gap: 10 }}>
              {selTasks.map((t) => (
                <Card key={t.id} style={{ paddingVertical: 12 }}>
                  <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                    <Pressable onPress={() => toggleTask(t.id)} hitSlop={10}>
                      <SIcon name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={t.done ? theme.success : theme.faint} />
                    </Pressable>
                    <Txt size={14} weight="s" style={{ flex: 1 }}>
                      {t.title}
                    </Txt>
                    <IconButton icon="trash" tone="muted" size={16} box={34} onPress={() => deleteTask(t.id)} />
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle title="خطة اليوم" icon="list" />
        <Card>
          {selBlocks.length === 0 ? (
            <Txt size={13} color={theme.subtext} align="center">
              لا يوجد جدول في هذا اليوم
            </Txt>
          ) : (
            selBlocks.filter((b) => b.type !== 'sleep').map((b) => (
              <View key={b.id} style={{ flexDirection: ROW, gap: 10, alignItems: 'center', paddingVertical: 7 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: b.type === 'study' ? PALETTE.primary : PALETTE.teal }} />
                <Txt size={13} weight="m" style={{ flex: 1 }} numberOfLines={1}>
                  {b.title}
                </Txt>
                <Txt size={12} weight="s" color={theme.subtext}>
                  {formatTime(b.start)}
                </Txt>
              </View>
            ))
          )}
        </Card>

        <SectionTitle title="اختبارات قادمة" icon="alarm" color={PALETTE.amber} />
        {upcomingExams.length === 0 ? (
          <EmptyState icon="ribbon" title="لا توجد اختبارات قادمة" desc="أضف اختباراتك لتذكّرك بها قبل موعداً بأسبوع." />
        ) : (
          <View style={{ gap: 10 }}>
            {upcomingExams.map((e) => (
              <Pressable key={e.id} onPress={() => setSelected(e.date)}>
                <Card style={{ paddingVertical: 13 }}>
                  <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: theme.dangerSoft, alignItems: 'center', justifyContent: 'center' }}>
                      <SIcon name="ribbon" size={20} color={theme.danger} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={14} weight="b">
                        {e.title}
                      </Txt>
                      <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                        {formatDateShort(new Date(`${e.date}T00:00:00`))} • {formatTime(e.time)}
                      </Txt>
                    </View>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Sheet visible={examSheet} onClose={() => setExamSheet(false)} title={`اختبار في ${formatDateShort(new Date(`${selected}T00:00:00`))}`}>
        <Input value={examTitle} onChangeText={setExamTitle} placeholder="مثال: اختبار الفصل الثاني فيزياء" returnKeyType="done" />
        <SectionTitle title="المادة" icon="albums" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
          {state.subjects.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setExamSubject(s.id)}
              style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: examSubject === s.id ? s.color : theme.card, borderWidth: 1, borderColor: examSubject === s.id ? s.color : theme.border }}
            >
              <Txt size={12.5} weight="s" color={examSubject === s.id ? '#fff' : theme.subtext}>
                {s.name}
              </Txt>
            </Pressable>
          ))}
        </View>
        <SectionTitle title="الوقت" icon="time" />
        <TimeEditor value={examTime} onChange={setExamTime} />
        <PrimaryButton
          label="إضافة الاختبار"
          icon="add"
          style={{ marginTop: 18 }}
          onPress={() => {
            if (!examTitle.trim()) return;
            addExam({ title: examTitle.trim(), subjectId: examSubject, date: selected, time: examTime });
            setExamTitle('');
            setExamSheet(false);
          }}
        />
      </Sheet>

      <Sheet visible={taskSheet} onClose={() => setTaskSheet(false)} title="مهمة جديدة">
        <Input value={taskTitle} onChangeText={setTaskTitle} placeholder="مثال: مراجعة الفصل الرابع رياضيات" returnKeyType="done" />
        <PrimaryButton
          label="إضافة المهمة"
          icon="add"
          style={{ marginTop: 18 }}
          onPress={() => {
            if (!taskTitle.trim()) return;
            addTask({ title: taskTitle.trim(), date: selected });
            setTaskTitle('');
            setTaskSheet(false);
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function Legend({ color, label, small }: { color: string; label: string; small?: boolean }) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 5 }}>
      <View style={{ width: small ? 7 : 12, height: small ? 7 : 12, borderRadius: small ? 4 : 4, backgroundColor: color }} />
      <Txt size={10.5} color={theme.subtext} weight="m">
        {label}
      </Txt>
    </View>
  );
}
