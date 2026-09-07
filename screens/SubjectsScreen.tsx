import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, EmptyState, IconButton, Input, PrimaryButton, ProgressBar, SectionTitle, Segmented, Sheet, SoftButton, Stepper, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '../lib/presets';
import { PALETTE, ROW, SPACING } from '../lib/theme';
import { Subject } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Subjects'>;

const PRIORITY_LABEL: Record<number, string> = { 1: 'منخفضة', 2: 'متوسطة', 3: 'عالية' };

export default function SubjectsScreen({ navigation }: Props) {
  const { theme, state, addSubject, updateSubject, deleteSubject } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [icon, setIcon] = useState(SUBJECT_ICONS[0]);
  const [hours, setHours] = useState(4);
  const [priority, setPriority] = useState<'1' | '2' | '3'>('2');

  const reset = () => {
    setEditing(null);
    setName('');
    setColor(SUBJECT_COLORS[0]);
    setIcon(SUBJECT_ICONS[0]);
    setHours(4);
    setPriority('2');
  };

  const openAdd = () => {
    reset();
    setOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setName(s.name);
    setColor(s.color);
    setIcon(s.icon);
    setHours(s.hoursPerWeek);
    setPriority(String(s.priority) as '1' | '2' | '3');
    setOpen(true);
  };

  const save = () => {
    const payload = {
      name: name.trim() || 'مادة جديدة',
      color,
      icon,
      hoursPerWeek: hours,
      priority: Number(priority) as 1 | 2 | 3,
    };
    if (editing) updateSubject(editing.id, payload);
    else addSubject(payload);
    setOpen(false);
  };

  const totalHours = state.subjects.reduce((a, s) => a + s.hoursPerWeek, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title="المواد الدراسية"
        subtitle={`${state.subjects.length} مواد • ${totalHours} ساعات أسبوعياً`}
        onBack={() => navigation.goBack()}
        right={<IconButton icon="add" onPress={openAdd} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {state.subjects.length === 0 ? (
          <EmptyState icon="albums" title="لا توجد مواد بعد" desc="أضف موادك الدراسية لنوزّع عليك الجدول تلقائياً." actionLabel="إضافة مادة" onAction={openAdd} />
        ) : (
          <View style={{ gap: 12 }}>
            {state.subjects.map((s) => {
              const lessons = state.lessons.filter((l) => l.subjectId === s.id);
              const done = lessons.filter((l) => l.done).length;
              return (
                <Pressable key={s.id} onPress={() => navigation.navigate('SubjectDetail', { subjectId: s.id })}>
                  <Card level={1}>
                    <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: `${s.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                        <SIcon name={s.icon} size={23} color={s.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: ROW, alignItems: 'center', gap: 8 }}>
                          <Txt size={15.5} weight="b" numberOfLines={1}>
                            {s.name}
                          </Txt>
                          <View style={{ backgroundColor: s.priority === 3 ? PALETTE.rose + '22' : s.priority === 2 ? PALETTE.amber + '22' : PALETTE.teal + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                            <Txt size={10.5} weight="s" color={s.priority === 3 ? PALETTE.rose : s.priority === 2 ? PALETTE.amber : PALETTE.teal}>
                              أولوية {PRIORITY_LABEL[s.priority]}
                            </Txt>
                          </View>
                        </View>
                        <Txt size={12} color={theme.subtext} style={{ marginTop: 3 }}>
                          {s.hoursPerWeek} ساعات أسبوعياً • {lessons.length} درساً
                        </Txt>
                      </View>
                      <IconButton icon="create" tone="muted" size={17} box={36} onPress={() => openEdit(s)} />
                    </View>
                    <View style={{ marginTop: 14 }}>
                      <View style={{ flexDirection: ROW, justifyContent: 'space-between', marginBottom: 6 }}>
                        <Txt size={11.5} color={theme.subtext} weight="m">
                          الدروس المكتملة
                        </Txt>
                        <Txt size={11.5} weight="b" color={s.color}>
                          {done}/{lessons.length}
                        </Txt>
                      </View>
                      <ProgressBar value={lessons.length ? done / lessons.length : 0} color={s.color} height={8} />
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}

        <SectionTitle title="توزيع ساعات الأسبوع" icon="pie-chart" color={PALETTE.purple} />
        <Card>
          {state.subjects.map((s) => (
            <View key={s.id} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: ROW, justifyContent: 'space-between', marginBottom: 4 }}>
                <Txt size={12.5} weight="s">
                  {s.name}
                </Txt>
                <Txt size={12} color={theme.subtext}>
                  {s.hoursPerWeek} س
                </Txt>
              </View>
              <ProgressBar value={Math.min(1, s.hoursPerWeek / 8)} color={s.color} height={7} />
            </View>
          ))}
          {state.subjects.length === 0 ? <Txt size={12.5} color={theme.subtext}>لا توجد بيانات</Txt> : null}
        </Card>
      </ScrollView>

      <Sheet visible={open} onClose={() => setOpen(false)} title={editing ? 'تعديل المادة' : 'إضافة مادة جديدة'}>
        <SectionTitle title="اسم المادة" icon="pencil" />
        <Input value={name} onChangeText={setName} placeholder="مثال: الفيزياء" returnKeyType="done" />

        <SectionTitle title="اللون" icon="color-palette" />
        <View style={{ flexDirection: ROW, gap: 10, flexWrap: 'wrap' }}>
          {SUBJECT_COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} style={{ width: 38, height: 38, borderRadius: 14, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: theme.text }}>
              {color === c ? <SIcon name="checkmark" size={18} color="#fff" /> : null}
            </Pressable>
          ))}
        </View>

        <SectionTitle title="الأيقونة" icon="sparkles" />
        <View style={{ flexDirection: ROW, gap: 10, flexWrap: 'wrap' }}>
          {SUBJECT_ICONS.map((ic) => (
            <Pressable key={ic} onPress={() => setIcon(ic)} style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: icon === ic ? color : theme.mode === 'dark' ? '#1D2440' : '#F3F5FB', alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name={ic} size={21} color={icon === ic ? '#fff' : theme.subtext} />
            </Pressable>
          ))}
        </View>

        <SectionTitle title="ساعات الأسبوع" icon="hourglass" />
        <Card style={{ marginBottom: 6 }}>
          <Stepper value={hours} onChange={setHours} step={1} min={1} max={15} format={(v) => `${v} ساعات`} />
        </Card>

        <SectionTitle title="الأولوية" icon="trending-up" />
        <Segmented
          options={[
            { label: 'منخفضة', value: '1' },
            { label: 'متوسطة', value: '2' },
            { label: 'عالية', value: '3' },
          ]}
          value={priority}
          onChange={(v) => setPriority(v as '1' | '2' | '3')}
        />

        <View style={{ flexDirection: ROW, gap: 10, marginTop: 20 }}>
          {editing ? (
            <SoftButton
              label="حذف"
              icon="trash"
              tone="danger"
              style={{ flex: 1 }}
              onPress={() => {
                deleteSubject(editing.id);
                setOpen(false);
              }}
            />
          ) : null}
          <PrimaryButton label={editing ? 'حفظ التعديلات' : 'إضافة المادة'} icon="checkmark" style={{ flex: 1 }} onPress={save} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
