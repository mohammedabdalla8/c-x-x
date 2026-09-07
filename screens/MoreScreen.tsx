import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { Card, Row, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { GRADE_LABELS, BRANCH_LABELS } from '../lib/presets';
import { levelTitle } from '../lib/quotes';
import { PALETTE, CHEVRON_NEXT, ROW, RADIUS, SPACING, shadow } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const ITEMS: { icon: string; color: string; title: string; desc: string; to: keyof RootStackParamList }[] = [
  { icon: 'albums', color: PALETTE.primary, title: 'المواد الدراسية', desc: 'أضف موادك واحدد أولوياتك ودروسك', to: 'Subjects' },
  { icon: 'flag', color: PALETTE.rose, title: 'الأهداف', desc: 'تابع أهدافك اليومية والأسبوعية', to: 'Goals' },
  { icon: 'ribbon', color: PALETTE.purple, title: 'الإنجازات والشارات', desc: 'اجمع الشارات وارتقِ بمستواك', to: 'Achievements' },
  { icon: 'stats-chart', color: PALETTE.teal, title: 'الإحصائيات', desc: 'رسوم بيانية لساعاتك وموادك', to: 'Stats' },
  { icon: 'alarm', color: PALETTE.amber, title: 'المنبهات والإشعارات', desc: 'تحكم كامل بكل تنبيهاتك', to: 'Alarms' },
  { icon: 'person', color: '#38B6FF', title: 'الملف الشخصي', desc: 'اسمك ومستواك وإنجازاتك', to: 'Profile' },
  { icon: 'settings', color: '#64748B', title: 'الإعدادات', desc: 'المظهر والروتين والنسخ الاحتياطي', to: 'Settings' },
];

export default function MoreScreen({ navigation }: Props) {
  const { theme, state, stats, levelInfo } = useApp();
  const profile = state.profile;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.primary, '#7C5BF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 26, padding: 20 }}
        >
          <View style={{ flexDirection: ROW, alignItems: 'center', gap: 14 }}>
            <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' }}>
              <Txt size={24} weight="x" color="#fff">
                {(profile?.name || 'ط').trim().charAt(0)}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={18} weight="b" color="#fff">
                {profile?.name || 'طالب'}
              </Txt>
              <Txt size={12} weight="m" color="rgba(255,255,255,0.9)" style={{ marginTop: 2 }}>
                {profile ? `${GRADE_LABELS[profile.grade]}${profile.branch ? ` • ${BRANCH_LABELS[profile.branch]}` : ''}` : 'لم يتم الإعداد بعد'}
              </Txt>
              <View style={{ flexDirection: ROW, gap: 8, marginTop: 10 }}>
                <Pill icon="ribbon" label={`المستوى ${levelInfo.level} — ${levelTitle(levelInfo.level)}`} />
                <Pill icon="flame" label={`${stats.streak} يوم`} />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={{ marginTop: 18, gap: 10 }}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => navigation.navigate(item.to as never)}
              style={({ pressed }) => ({
                flexDirection: ROW,
                alignItems: 'center',
                gap: 14,
                backgroundColor: theme.card,
                borderRadius: RADIUS.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.border,
                opacity: pressed ? 0.88 : 1,
                ...shadow(1),
              })}
            >
              <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: `${item.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={item.icon} size={21} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14.5} weight="b">
                  {item.title}
                </Txt>
                <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
                  {item.desc}
                </Txt>
              </View>
              <SIcon name={CHEVRON_NEXT} size={18} color={theme.faint} />
            </Pressable>
          ))}
        </View>

        <Txt size={11.5} color={theme.faint} align="center" style={{ marginTop: 22 }}>
          منظّم الطالب • نسخة ١.٠ • يعمل بدون إنترنت 🌱
        </Txt>
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
      <SIcon name={icon} size={12} color="#fff" />
      <Txt size={11} weight="s" color="#fff">
        {label}
      </Txt>
    </View>
  );
}
