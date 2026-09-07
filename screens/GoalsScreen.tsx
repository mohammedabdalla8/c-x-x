import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, EmptyState, IconButton, Input, PrimaryButton, ProgressBar, SectionTitle, Sheet, Stepper, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { PALETTE, ROW, SPACING } from '../lib/theme';
import { GoalKind } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Goals'>;

const TEMPLATES: { kind: GoalKind; title: string; icon: string; color: string; unit: string; target: number }[] = [
  { kind: 'dailyHours', title: 'ساعات المذاكرة اليومية', icon: 'timer', color: PALETTE.primary, unit: 'ساعة', target: 4 },
  { kind: 'weeklyLessons', title: 'دروس هذا الأسبوع', icon: 'checkmark-done', color: PALETTE.green, unit: 'درس', target: 10 },
  { kind: 'streak', title: 'سلسلة الالتزام', icon: 'flame', color: PALETTE.amber, unit: 'يوم', target: 7 },
  { kind: 'pomodoros', title: 'جلسات التركيز', icon: 'hourglass', color: PALETTE.teal, unit: 'جلسة', target: 30 },
];

export default function GoalsScreen({ navigation }: Props) {
  const { theme, state, addGoal, deleteGoal, goalProgress } = useApp();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<GoalKind>('dailyHours');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(4);

  const openAdd = (t?: (typeof TEMPLATES)[number]) => {
    if (t) {
      setKind(t.kind);
      setTitle(t.title);
      setTarget(t.target);
    } else {
      setKind('custom');
      setTitle('');
      setTarget(5);
    }
    setOpen(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title="أهدافي"
        subtitle="أهداف واضحة = نتائج واضحة"
        onBack={() => navigation.goBack()}
        right={<IconButton icon="add" onPress={() => openAdd()} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {state.goals.length === 0 ? (
          <EmptyState icon="flag" title="لا توجد أهداف بعد" desc="اختر هدفاً جاهزاً أو أضف هدفاً خاصاً بك." actionLabel="إضافة هدف" onAction={() => openAdd()} />
        ) : (
          <View style={{ gap: 12 }}>
            {state.goals.map((g) => {
              const p = goalProgress(g);
              const meta = TEMPLATES.find((t) => t.kind === g.kind);
              const icon = g.icon || meta?.icon || 'flag';
              const color = meta?.color || PALETTE.primary;
              return (
                <Card key={g.id} level={1}>
                  <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: `${color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                      <SIcon name={icon} size={22} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Txt size={15} weight="b" numberOfLines={2}>
                        {g.title}
                      </Txt>
                      <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
                        {p.label}
                      </Txt>
                    </View>
                    <IconButton icon="trash" tone="muted" size={16} box={34} onPress={() => deleteGoal(g.id)} />
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <ProgressBar value={p.pct} color={color} height={9} />
                    <Txt size={11} color={theme.faint} style={{ marginTop: 6 }}>
                      {Math.round(p.pct * 100)}% من الهدف {p.pct >= 1 ? '• محقق 🎉' : ''}
                    </Txt>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        <SectionTitle title="أهداف جاهزة" icon="sparkles" color={PALETTE.purple} />
        <View style={{ gap: 10 }}>
          {TEMPLATES.map((t) => (
            <Pressable key={t.kind} onPress={() => openAdd(t)}>
              <Card style={{ paddingVertical: 14 }}>
                <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: `${t.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                    <SIcon name={t.icon} size={19} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={14} weight="s">
                      {t.title}
                    </Txt>
                    <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                      الهدف الافتراضي: {t.target} {t.unit}
                    </Txt>
                  </View>
                  <SIcon name="add-circle" size={24} color={t.color} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Sheet visible={open} onClose={() => setOpen(false)} title="هدف جديد">
        <SectionTitle title="النوع" icon="flag" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
          {[...TEMPLATES, { kind: 'custom' as GoalKind, title: 'مخصص', icon: 'create', color: PALETTE.rose, unit: '', target: 0 }].map((t) => (
            <Pressable
              key={t.kind}
              onPress={() => {
                setKind(t.kind);
                if (t.kind !== 'custom') setTitle(t.title);
                if (t.target) setTarget(t.target);
              }}
              style={{ paddingHorizontal: 13, paddingVertical: 9, borderRadius: 999, backgroundColor: kind === t.kind ? t.color : theme.card, borderWidth: 1, borderColor: kind === t.kind ? t.color : theme.border }}
            >
              <Txt size={12.5} weight="s" color={kind === t.kind ? '#fff' : theme.subtext}>
                {t.title}
              </Txt>
            </Pressable>
          ))}
        </View>

        <SectionTitle title="عنوان الهدف" icon="pencil" />
        <Input value={title} onChangeText={setTitle} placeholder="مثال: أنهي فصل التحويلات" returnKeyType="done" />

        <SectionTitle title="الرقم المستهدف" icon="analytics" />
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={target} onChange={setTarget} step={1} min={1} max={100} />
        </Card>

        <PrimaryButton
          label="حفظ الهدف"
          icon="checkmark"
          style={{ marginTop: 18 }}
          onPress={() => {
            addGoal({ title: title.trim() || 'هدف جديد', kind, target });
            setOpen(false);
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}
