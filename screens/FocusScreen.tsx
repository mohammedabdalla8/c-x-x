import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SIcon } from '../components/SIcon';
import { IconButton, Txt } from '../components/ui';
import { Ring } from '../components/Charts';
import { useApp } from '../lib/store';
import { notifyNow } from '../lib/notifications';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Focus'>;

interface Pomo {
  focus: number;
  short: number;
  long: number;
  rounds: number;
}

const POMO: Pomo = { focus: 25, short: 5, long: 15, rounds: 4 };

const fmt = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${m < 10 ? '0' + m : m}:${sec < 10 ? '0' + sec : sec}`;
};

export default function FocusScreen({ navigation, route }: Props) {
  const { theme, state, haptic, logSession, addPomodoro } = useApp();
  const [subjectId, setSubjectId] = useState<string | undefined>(route.params?.subjectId || state.subjects[0]?.id);
  const [lessonId, setLessonId] = useState<string | undefined>(route.params?.lessonId);
  const [mode, setMode] = useState<'focus' | 'short' | 'long'>('focus');
  const [running, setRunning] = useState(true);
  const [remaining, setRemaining] = useState(POMO.focus * 60);
  const [rounds, setRounds] = useState(0);
  const endTs = useRef<number>(Date.now() + POMO.focus * 60000);
  const appState = useRef(AppState.currentState);

  const subject = state.subjects.find((s) => s.id === subjectId);
  const lesson = state.lessons.find((l) => l.id === lessonId);
  const total = (mode === 'focus' ? POMO.focus : mode === 'short' ? POMO.short : POMO.long) * 60;

  const finishRound = useCallback(() => {
    haptic('success');
    notifyNow('انتهت جلسة التركيز 🎉', mode === 'focus' ? `أحسنت! استراحة ${POMO.short} دقائق تستحقها.` : 'انتهت الاستراحة — جاهز لجديدة؟');
    if (mode === 'focus') {
      addPomodoro(POMO.focus, subjectId);
      const nextRounds = rounds + 1;
      setRounds(nextRounds);
      const nextMode = nextRounds % POMO.rounds === 0 ? 'long' : 'short';
      setMode(nextMode);
      endTs.current = Date.now() + (nextMode === 'long' ? POMO.long : POMO.short) * 60000;
      setRemaining((nextMode === 'long' ? POMO.long : POMO.short) * 60);
    } else {
      setMode('focus');
      endTs.current = Date.now() + POMO.focus * 60000;
      setRemaining(POMO.focus * 60);
    }
    setRunning(true);
  }, [mode, rounds, subjectId, addPomodoro, haptic]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const left = Math.ceil((endTs.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) finishRound();
    }, 500);
    return () => clearInterval(t);
  }, [running, finishRound]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        const left = Math.ceil((endTs.current - Date.now()) / 1000);
        setRemaining(left > 0 ? left : 0);
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  const togglePause = () => {
    haptic('light');
    if (running) {
      setRunning(false);
    } else {
      endTs.current = Date.now() + remaining * 1000;
      setRunning(true);
    }
  };

  const skip = () => {
    haptic('medium');
    endTs.current = Date.now();
    setRemaining(0);
    setRunning(true);
  };

  const endSession = () => {
    haptic('medium');
    const spentFocus = rounds * POMO.focus + (mode === 'focus' ? Math.round((POMO.focus * 60 - Math.max(0, remaining)) / 60) : 0);
    navigation.replace('SessionSummary', {
      minutes: Math.max(1, spentFocus),
      subjectId,
      lessonId,
      pomodoros: rounds,
    });
  };

  const tint = mode === 'focus' ? PALETTE.teal : mode === 'short' ? PALETTE.amber : PALETTE.purple;
  const modeLabel = mode === 'focus' ? 'وقت التركيز' : mode === 'short' ? 'استراحة قصيرة' : 'استراحة طويلة ☕';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <LinearGradient colors={[`${tint}22`, theme.bg]} style={{ flex: 1, paddingHorizontal: SPACING.lg, paddingTop: 8 }}>
        <View style={{ flexDirection: ROW, alignItems: 'center' }}>
          <IconButton icon="close" tone="muted" onPress={endSession} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Txt size={14} weight="b" color={tint}>
              {modeLabel}
            </Txt>
          </View>
          <IconButton icon="play-skip-forward" tone="muted" size={17} onPress={skip} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 26 }}>
          <Ring progress={1 - remaining / total} size={272} stroke={18} color={tint}>
            <Txt size={56} weight="x" align="center">
              {fmt(remaining)}
            </Txt>
            <Txt size={13} weight="s" color={theme.subtext} align="center" style={{ marginTop: -4 }}>
              من {total / 60} دقيقة
            </Txt>
          </Ring>

          <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: ROW, alignItems: 'center', gap: 8 }}>
              <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: `${subject?.color || PALETTE.primary}1F`, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name={subject?.icon || 'book'} size={17} color={subject?.color || PALETTE.primary} />
              </View>
              <Txt size={18} weight="b" align="center">
                {subject?.name || 'مذاكرة عامة'}
              </Txt>
            </View>
            {lesson ? (
              <Txt size={13} color={theme.subtext} weight="m" align="center">
                {lesson.title}
              </Txt>
            ) : null}
          </View>

          <View style={{ flexDirection: ROW, gap: 8 }}>
            {Array.from({ length: POMO.rounds }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: 5,
                  backgroundColor: i < rounds % POMO.rounds || (rounds > 0 && rounds % POMO.rounds === 0) ? tint : theme.mode === 'dark' ? '#252D4C' : '#E5E9F5',
                }}
              />
            ))}
          </View>
          <Txt size={12} color={theme.faint} weight="m">
            {rounds} جلسة مكتملة هذه الجلسة
          </Txt>
        </View>

        <View style={{ flexDirection: ROW, gap: 14, paddingBottom: 18, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            onPress={endSession}
            style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: theme.dangerSoft, alignItems: 'center', justifyContent: 'center' }}
          >
            <SIcon name="stop" size={26} color={theme.danger} />
          </Pressable>
          <Pressable onPress={togglePause}>
            <LinearGradient
              colors={[tint, tint]}
              style={{ width: 88, height: 88, borderRadius: 34, alignItems: 'center', justifyContent: 'center' }}
            >
              <SIcon name={running ? 'pause' : 'play'} size={38} color="#fff" />
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={() => {
              haptic('light');
              navigation.goBack();
            }}
            style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: theme.mode === 'dark' ? '#1D2440' : '#F1F3FA', alignItems: 'center', justifyContent: 'center' }}
          >
            <SIcon name="albums" size={24} color={theme.subtext} />
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
