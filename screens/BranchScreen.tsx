import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIcon } from '../components/SIcon';
import { AppHeader, PrimaryButton, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { BRANCH_LABELS, defaultSubjects } from '../lib/presets';
import { ROW, RADIUS, SPACING } from '../lib/theme';
import { Branch, Grade } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Branch'>;

const META: Record<Branch, { icon: string; color: string; desc: string }> = {
  'sci-bio': { icon: 'flask', color: '#12B5A0', desc: 'فيزياء • كيمياء • أحياء • جيولوجيا' },
  'sci-math': { icon: 'calculator', color: '#F2557E', desc: 'فيزياء • كيمياء • رياضيات تفاضل وتكامل' },
  arts: { icon: 'earth', color: '#F5A524', desc: 'تاريخ • جغرافيا • فلسفة ومنطق' },
};

export default function BranchScreen({ navigation, route }: Props) {
  const { theme } = useApp();
  const { name, grade } = route.params;
  const options: Branch[] = grade === 'first' ? ['sci-bio', 'arts'] : ['sci-bio', 'sci-math', 'arts'];
  const [branch, setBranch] = useState<Branch | null>(options.length === 1 ? options[0] : null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <AppHeader
        title="اختر شعبتك"
        subtitle={grade === 'first' ? 'سنبني المواد الأساسية حسب اختيارك' : 'سنجهّز لك المواد تلقائياً حسب الشعبة'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 30 }}>
        <View style={{ gap: 12 }}>
          {options.map((b) => {
            const active = branch === b;
            const meta = META[b];
            const subjectsPreview = defaultSubjects(grade, b).slice(0, 4).map((s) => s.name).join(' • ');
            return (
              <Pressable
                key={b}
                onPress={() => setBranch(b)}
                style={({ pressed }) => ({
                  backgroundColor: active ? theme.primarySoft : theme.card,
                  borderRadius: RADIUS.lg,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: active ? theme.primary : theme.border,
                  opacity: pressed ? 0.92 : 1,
                })}
              >
                <View style={{ flexDirection: ROW, gap: 14, alignItems: 'center' }}>
                  <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: `${meta.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                    <SIcon name={meta.icon} size={26} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Txt size={16} weight="b">
                      {BRANCH_LABELS[b]}
                    </Txt>
                    <Txt size={12.5} color={theme.subtext} style={{ marginTop: 3 }}>
                      {meta.desc}
                    </Txt>
                  </View>
                  <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={active ? theme.primary : theme.border} />
                </View>
                <Txt size={11.5} color={theme.faint} style={{ marginTop: 12 }}>
                  المواد: {subjectsPreview} ...
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: 12 }}>
        <PrimaryButton
          label="التالي — إعداد روتيتي"
          icon="arrow-back"
          disabled={!branch}
          onPress={() => navigation.navigate('Routine', { name, grade, branch: branch as Branch })}
        />
      </View>
    </SafeAreaView>
  );
}
