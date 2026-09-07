import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIcon } from '../components/SIcon';
import { AppHeader, PrimaryButton, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { GRADE_LABELS } from '../lib/presets';
import { ROW, RADIUS, SPACING } from '../lib/theme';
import { Grade } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Grade'>;

const OPTIONS: { id: Grade; icon: string; desc: string; color: string }[] = [
  { id: 'first', icon: 'leaf', desc: 'بداية قوية وتأسيس للمواد الأساسية', color: '#25C16F' },
  { id: 'second', icon: 'trending-up', desc: 'سنة صناعة الشخصية الأكاديمية', color: '#38B6FF' },
  { id: 'third', icon: 'rocket', desc: 'سنة التخرّج — خطة مكثفة للثانوية العامة', color: '#F2557E' },
];

export default function GradeScreen({ navigation, route }: Props) {
  const { theme, state } = useApp();
  const name = route.params?.name ?? state.profile?.name ?? '';
  const [grade, setGrade] = useState<Grade | null>(state.profile?.grade ?? null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <AppHeader title="ما هو صفك الدراسي؟" subtitle={`أهلاً ${name || 'بك'} — اختر صفك لنجهّز لك المواد والجدول`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 30 }}>
        <View style={{ gap: 12 }}>
          {OPTIONS.map((o) => {
            const active = grade === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => setGrade(o.id)}
                style={({ pressed }) => ({
                  flexDirection: ROW,
                  gap: 14,
                  alignItems: 'center',
                  backgroundColor: active ? theme.primarySoft : theme.card,
                  borderRadius: RADIUS.lg,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: active ? theme.primary : theme.border,
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: `${o.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                  <SIcon name={o.icon} size={26} color={o.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={16} weight="b">
                    {GRADE_LABELS[o.id]}
                  </Txt>
                  <Txt size={12.5} color={theme.subtext} style={{ marginTop: 3 }}>
                    {o.desc}
                  </Txt>
                </View>
                <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={active ? theme.primary : theme.border} />
              </Pressable>
            );
          })}
        </View>

        {grade === 'third' ? (
          <View style={{ marginTop: 18, backgroundColor: theme.warnSoft, borderRadius: RADIUS.md, padding: 14, flexDirection: ROW, gap: 10 }}>
            <SIcon name="sparkles" size={20} color={theme.warn} />
            <Txt size={12.5} color={theme.text} style={{ flex: 1, lineHeight: 21 }}>
              ممتاز! في الخطوة القادمة ستختار شعبتك (علمي علوم / علمي رياضة / أدبي) وسنجهّز لك المواد تلقائياً.
            </Txt>
          </View>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: 12 }}>
        <PrimaryButton label="التالي" icon="arrow-back" disabled={!grade} onPress={() => navigation.navigate('Branch', { name, grade: grade as Grade })} />
      </View>
    </SafeAreaView>
  );
}
