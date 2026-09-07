import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, ProgressBar, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { computeBadges } from '../lib/badges';
import { PALETTE, ROW, RADIUS, SPACING, shadow } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Achievements'>;

export default function AchievementsScreen({ navigation }: Props) {
  const { theme, stats } = useApp();
  const badges = useMemo(() => computeBadges(stats), [stats]);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="الإنجازات" subtitle="اجمع الشارات وارفع مستواك" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[PALETTE.amber, '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 20, flexDirection: ROW, alignItems: 'center', gap: 16 }}>
          <View style={{ width: 66, height: 66, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="trophy" size={34} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt size={20} weight="x" color="#fff">
              {earned} / {badges.length}
            </Txt>
            <Txt size={12.5} weight="m" color="rgba(255,255,255,0.92)" style={{ marginTop: 2 }}>
              شارة مكتسبة — استمر لتجمع الباقي
            </Txt>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)', marginTop: 10, overflow: 'hidden' }}>
              <View style={{ width: `${(earned / badges.length) * 100}%`, height: '100%', backgroundColor: '#fff' }} />
            </View>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: ROW, flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          {badges.map((b) => (
            <View
              key={b.id}
              style={{
                width: '48%',
                backgroundColor: b.earned ? theme.card : theme.mode === 'dark' ? '#121729' : '#F7F8FC',
                borderRadius: RADIUS.lg,
                padding: 16,
                borderWidth: 1,
                borderColor: b.earned ? `${b.color}55` : theme.border,
                opacity: b.earned ? 1 : 0.85,
                ...shadow(1),
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 17, backgroundColor: b.earned ? `${b.color}22` : theme.mode === 'dark' ? '#1B2240' : '#ECEFF7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <SIcon name={b.icon} size={24} color={b.earned ? b.color : theme.faint} />
              </View>
              <Txt size={14} weight="b" color={b.earned ? theme.text : theme.subtext}>
                {b.title}
              </Txt>
              <Txt size={11.5} color={theme.subtext} style={{ marginTop: 3, lineHeight: 18 }}>
                {b.desc}
              </Txt>
              {b.earned ? (
                <View style={{ flexDirection: ROW, alignItems: 'center', gap: 5, marginTop: 10 }}>
                  <SIcon name="checkmark-circle" size={15} color={theme.success} />
                  <Txt size={11.5} weight="s" color={theme.success}>
                    مكتسبة
                  </Txt>
                </View>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <ProgressBar value={b.value / b.target} color={b.color} height={6} />
                  <Txt size={10.5} color={theme.faint} style={{ marginTop: 5 }}>
                    {Math.round(b.value)} / {b.target}
                  </Txt>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
