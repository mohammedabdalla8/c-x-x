import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, Input, PrimaryButton, SectionTitle, Sheet, SoftButton, StatTile, Txt } from '../components/ui';
import { Ring } from '../components/Charts';
import { useApp } from '../lib/store';
import { BRANCH_LABELS, GRADE_LABELS, defaultSubjects } from '../lib/presets';
import { levelTitle } from '../lib/quotes';
import { formatDuration } from '../lib/format';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { Branch, Grade } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { theme, state, stats, levelInfo, updateProfile, setSubjects } = useApp();
  const profile = state.profile;
  const [nameOpen, setNameOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [name, setName] = useState(profile?.name || '');

  if (!profile) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="الملف الشخصي" subtitle="هويتك ومسارك الدراسي" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.primary, '#7C5BF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 22, alignItems: 'center' }}>
          <View style={{ width: 92, height: 92, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }}>
            <Txt size={34} weight="x" color="#fff">
              {profile.name.trim().charAt(0)}
            </Txt>
          </View>
          <Txt size={21} weight="x" color="#fff" style={{ marginTop: 12 }}>
            {profile.name}
          </Txt>
          <Txt size={12.5} weight="m" color="rgba(255,255,255,0.92)" align="center" style={{ marginTop: 4 }}>
            {GRADE_LABELS[profile.grade]}
            {profile.branch ? ` • ${BRANCH_LABELS[profile.branch]}` : ''}
          </Txt>
          <View style={{ flexDirection: ROW, gap: 10, marginTop: 14 }}>
            <Pill icon="ribbon" label={`المستوى ${levelInfo.level}`} />
            <Pill icon="star" label={`${state.meta.points} نقطة`} />
            <Pill icon="flame" label={`${stats.streak} يوم`} />
          </View>
        </LinearGradient>

        <View style={{ flexDirection: ROW, gap: 10, marginTop: 14 }}>
          <SoftButton label="تعديل الاسم" icon="create" tone="primary" small style={{ flex: 1 }} onPress={() => setNameOpen(true)} />
          <SoftButton label="تغيير الصف" icon="school" tone="muted" small style={{ flex: 1 }} onPress={() => setGradeOpen(true)} />
        </View>

        <SectionTitle title="مستواك" icon="trending-up" color={PALETTE.purple} />
        <Card>
          <View style={{ flexDirection: ROW, gap: 16, alignItems: 'center' }}>
            <Ring progress={levelInfo.progress} size={92} stroke={10} color={PALETTE.purple}>
              <Txt size={18} weight="x" align="center" color={PALETTE.purple}>
                {levelInfo.level}
              </Txt>
            </Ring>
            <View style={{ flex: 1 }}>
              <Txt size={15} weight="b">
                {levelTitle(levelInfo.level)}
              </Txt>
              <Txt size={12} color={theme.subtext} style={{ marginTop: 4, lineHeight: 20 }}>
                تبقى {levelInfo.toNext} نقطة للوصول إلى المستوى {levelInfo.level + 1}. كل جلسة تركيز تقربك خطوة.
              </Txt>
            </View>
          </View>
        </Card>

        <SectionTitle title="مسار الإنجاز" icon="stats-chart" />
        <View style={{ flexDirection: ROW, gap: 10, marginBottom: 10 }}>
          <StatTile icon="hourglass" label="ساعات مذاكرة" value={(stats.totalMinutes / 60).toFixed(1)} color={PALETTE.primary} />
          <StatTile icon="timer" label="جلسات تركيز" value={stats.pomodoros} color={PALETTE.teal} />
        </View>
        <View style={{ flexDirection: ROW, gap: 10, marginBottom: 10 }}>
          <StatTile icon="checkmark-done" label="دروس مكتملة" value={stats.lessonsDone} color={PALETTE.green} />
          <StatTile icon="flame" label="أطول سلسلة" value={`${stats.bestStreak} يوم`} color={PALETTE.amber} />
        </View>
        <View style={{ flexDirection: ROW, gap: 10 }}>
          <StatTile icon="bed" label="ليالي نوم بالموعد" value={stats.nights} color="#6366F1" />
          <StatTile icon="ribbon" label="الشارات المكتسبة" value={stats.level > 0 ? Math.min(12, Math.floor(stats.pomodoros / 3) + stats.daysLogged) : 0} color={PALETTE.rose} />
        </View>

        <View style={{ marginTop: 16 }}>
          <PrimaryButton label="عرض كل الشارات" icon="ribbon" onPress={() => navigation.navigate('Achievements')} />
        </View>
        <View style={{ flexDirection: ROW, gap: 10, marginTop: 10 }}>
          <SoftButton label="منبهاتي" icon="alarm" tone="muted" small style={{ flex: 1 }} onPress={() => navigation.navigate('Alarms')} />
          <SoftButton label="أهدافي" icon="flag" tone="muted" small style={{ flex: 1 }} onPress={() => navigation.navigate('Goals')} />
          <SoftButton label="الإعدادات" icon="settings" tone="muted" small style={{ flex: 1 }} onPress={() => navigation.navigate('Settings')} />
        </View>
      </ScrollView>

      <Sheet visible={nameOpen} onClose={() => setNameOpen(false)} title="تعديل الاسم">
        <Input value={name} onChangeText={setName} placeholder="اسمك الجديد" returnKeyType="done" />
        <PrimaryButton
          label="حفظ"
          icon="checkmark"
          style={{ marginTop: 18 }}
          onPress={() => {
            updateProfile({ name: name.trim() || profile.name });
            setNameOpen(false);
          }}
        />
      </Sheet>

      <Sheet visible={gradeOpen} onClose={() => setGradeOpen(false)} title="تغيير الصف والشعبة">
        <Txt size={12.5} color={theme.subtext} style={{ marginBottom: 12 }}>
          عند التغيير سنجهّز لك قائمة مواد جديدة حسب الصف المختار، وستُحذف دروس المواد السابقة.
        </Txt>
        {(['first', 'second', 'third'] as Grade[]).map((g) => (
          <Pressable
            key={g}
            onPress={() => {
              updateProfile({ grade: g, branch: g === 'third' ? profile.branch : null });
              setSubjects(defaultSubjects(g, g === 'third' ? profile.branch : null));
              setGradeOpen(false);
            }}
            style={{
              flexDirection: ROW,
              alignItems: 'center',
              gap: 12,
              backgroundColor: profile.grade === g ? theme.primarySoft : theme.card,
              borderRadius: RADIUS.md,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: profile.grade === g ? theme.primary : theme.border,
            }}
          >
            <SIcon name="school" size={20} color={theme.primary} />
            <Txt size={14} weight="s" style={{ flex: 1 }}>
              {GRADE_LABELS[g]}
            </Txt>
            {profile.grade === g ? <SIcon name="checkmark-circle" size={20} color={theme.primary} /> : null}
          </Pressable>
        ))}
        {profile.grade === 'third' ? (
          <>
            <Txt size={13} weight="b" style={{ marginTop: 10, marginBottom: 8 }}>
              الشعبة
            </Txt>
            <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
              {(['sci-bio', 'sci-math', 'arts'] as Branch[]).map((b) => (
                <Pressable
                  key={b}
                  onPress={() => {
                    updateProfile({ branch: b });
                    setSubjects(defaultSubjects('third', b));
                  }}
                  style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: profile.branch === b ? theme.primary : theme.card, borderWidth: 1, borderColor: profile.branch === b ? theme.primary : theme.border }}
                >
                  <Txt size={12.5} weight="s" color={profile.branch === b ? '#fff' : theme.subtext}>
                    {BRANCH_LABELS[b]}
                  </Txt>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

function Pill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 }}>
      <SIcon name={icon} size={12} color="#fff" />
      <Txt size={11} weight="s" color="#fff">
        {label}
      </Txt>
    </View>
  );
}
