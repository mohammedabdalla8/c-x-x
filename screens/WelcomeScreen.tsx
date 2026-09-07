import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { Input, PrimaryButton, Row, Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { RADIUS, ROW, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const FEATURES = [
  { icon: 'calendar', title: 'جدول ذكي تلقائي', desc: 'نبني يومك من النوم إلى المذاكرة والتمارين خلال دقيقة', color: '#5B67F1' },
  { icon: 'alarm', title: 'منبهات لا تفوّت', desc: 'تنبيهات متكررة لكل موعد في يومك حتى بعد إغلاق التطبيق', color: '#F5A524' },
  { icon: 'timer', title: 'تركيز بومودورو', desc: 'جلسات تركيز مع راحة، ونصارتك بالنقاط والشارات والسلسلة', color: '#12B5A0' },
];

export default function WelcomeScreen({ navigation }: Props) {
  const { theme, state } = useApp();
  const [name, setName] = useState(state.profile?.name || '');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={[theme.primary, '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 30, padding: 26, paddingTop: 34 }}
          >
            <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name="school" size={32} color="#fff" />
            </View>
            <Txt size={26} weight="x" color="#fff" style={{ marginTop: 18 }}>
              أهلاً بك في منظّم الطالب
            </Txt>
            <Txt size={13.5} weight="m" color="rgba(255,255,255,0.9)" style={{ marginTop: 8, lineHeight: 23 }}>
              رفيقك الذكي في الثانوية العامة: نرتب لك يومك كاملاً، نذكّرك بكل موعد، ونقيس تقدّمك خطوة بخطوة.
            </Txt>
          </LinearGradient>

          <View style={{ marginTop: 22, gap: 12 }}>
            {FEATURES.map((f) => (
              <View
                key={f.title}
                style={{
                  flexDirection: ROW,
                  gap: 14,
                  alignItems: 'center',
                  backgroundColor: theme.card,
                  borderRadius: RADIUS.lg,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: `${f.color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                  <SIcon name={f.icon} size={22} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt size={15} weight="b">
                    {f.title}
                  </Txt>
                  <Txt size={12.5} color={theme.subtext} style={{ marginTop: 3, lineHeight: 20 }}>
                    {f.desc}
                  </Txt>
                </View>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 24 }}>
            <Txt size={13.5} weight="s" style={{ marginBottom: 8 }}>
              ما اسمك يا بطل؟
            </Txt>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="اكتب اسمك هنا"
              returnKeyType="done"
              maxLength={24}
            />
          </View>

          <View style={{ marginTop: 18 }}>
            <PrimaryButton
              label={state.onboarded ? 'تعديل خطتي' : 'هيا نبدأ الإعداد'}
              icon="arrow-back"
              onPress={() => navigation.navigate('Grade', { name })}
            />
          </View>
          <Txt size={11.5} color={theme.faint} align="center" style={{ marginTop: 14 }}>
            الإعداد يستغرق أقل من ٥ دقائق
          </Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
