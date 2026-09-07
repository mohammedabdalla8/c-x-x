import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SIcon } from '../components/SIcon';
import { Txt } from '../components/ui';
import { useApp } from '../lib/store';
import { F, RADIUS } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { hydrated, state } = useApp();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(dots, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(dots, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [scale, opacity, dots]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      navigation.replace(state.onboarded ? 'Main' : 'Welcome');
    }, 1500);
    return () => clearTimeout(t);
  }, [hydrated, state.onboarded, navigation]);

  return (
    <LinearGradient colors={['#4A55E0', '#6D5BF6', '#8B5CF6']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" />
      <Animated.View style={{ opacity, transform: [{ scale }], alignItems: 'center' }}>
        <View
          style={{
            width: 108,
            height: 108,
            borderRadius: RADIUS.xl,
            backgroundColor: 'rgba(255,255,255,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
          }}
        >
          <View style={{ width: 74, height: 74, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <SIcon name="school" size={38} color="#4A55E0" />
          </View>
        </View>
        <Txt size={30} weight="x" color="#fff" style={{ marginTop: 22, textAlign: 'center' }}>
          منظّم الطالب
        </Txt>
        <Txt size={14.5} weight="m" color="rgba(255,255,255,0.85)" style={{ marginTop: 8, textAlign: 'center' }}>
          خطوتك الأولى نحو الثانوية العامة بذكاء
        </Txt>
        <Animated.View style={{ flexDirection: 'row', gap: 6, marginTop: 26, opacity: dots.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
          ))}
        </Animated.View>
      </Animated.View>
      <Txt size={11.5} weight="m" color="rgba(255,255,255,0.7)" style={{ position: 'absolute', bottom: 34 }}>
        جدول ذكي • تنبيهات مستمرة • تركيز أعلى
      </Txt>
    </LinearGradient>
  );
}
