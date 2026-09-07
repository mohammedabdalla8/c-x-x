import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  AppState,
  Block,
  DayLog,
  Exam,
  Goal,
  Lesson,
  Routine,
  Settings,
  Subject,
  Task,
  Alarm,
  Profile,
  SessionLog,
} from './types';
import { darkTheme, lightTheme, Theme } from './theme';
import { defaultAlarms, defaultGoals, defaultRoutine, defaultSubjects } from './presets';
import { getDayPlan, plannedStudyMinutes, isStudyDay } from './schedule';
import { levelFor, POINTS, StatsSnapshot } from './badges';
import { syncAlarms, cancelAllScheduled, getPermission, requestPermission } from './notifications';
import { nowMinutes, toDateKey } from './format';
import { uid } from './ids';

const STORAGE_KEY = 'munazzim.student.v1';

function initialState(): AppState {
  return {
    version: 1,
    onboarded: false,
    profile: null,
    routine: defaultRoutine(),
    subjects: [],
    lessons: [],
    logs: {},
    goals: defaultGoals(),
    exams: [],
    tasks: [],
    alarms: [],
    settings: { theme: 'system', sound: 'classic', notifications: true, haptics: true },
    meta: { points: 0, pomodoros: 0, lessonsDone: 0, focusSum: 0, focusCount: 0, nights: 0 },
  };
}

function emptyLog(date: string): DayLog {
  return { date, studyMinutes: 0, completedBlockIds: [], sessions: [], subjectMinutes: {}, pomodoros: 0, lessonsDone: 0 };
}

function ensureLog(s: AppState, date: string): DayLog {
  return s.logs[date] ? { ...s.logs[date] } : emptyLog(date);
}

export interface StoreValue {
  state: AppState;
  hydrated: boolean;
  theme: Theme;
  todayKey: string;
  nowMin: number;
  todayLog: DayLog;
  todayBlocks: Block[];
  dayPlanPlanned: number;
  dayStats: {
    planned: number;
    done: number;
    pct: number;
    next?: Block;
    blocksDone: number;
    blocksTotal: number;
  };
  week: { date: string; minutes: number; planned: number; done: boolean }[];
  weekMinutes: number;
  topSubjectId?: string;
  stats: StatsSnapshot;
  levelInfo: ReturnType<typeof levelFor>;
  goalProgress: (g: Goal) => { value: number; pct: number; label: string };
  getBlocksForDate: (dateKey: string) => Block[];
  haptic: (style?: 'light' | 'medium' | 'success') => void;
  completeOnboarding: (p: { name: string; grade: Profile['grade']; branch: Profile['branch'] | null; routine: Routine }) => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => void;
  updateRoutine: (r: Routine) => Promise<void>;
  setSubjects: (list: Subject[]) => Promise<void>;
  addSubject: (s: Omit<Subject, 'id' | 'order'>) => void;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addLesson: (subjectId: string, title: string, estMinutes: number) => void;
  toggleLesson: (id: string) => void;
  deleteLesson: (id: string) => void;
  completeBlock: (block: Block, date?: string) => void;
  uncompleteBlock: (blockId: string, date?: string) => void;
  logSession: (input: { minutes: number; subjectId?: string; lessonId?: string; focus: number; completed: boolean; note?: string; kind: 'pomodoro' | 'manual' }) => void;
  addPomodoro: (minutes: number, subjectId?: string) => void;
  markSlept: () => void;
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void;
  deleteGoal: (id: string) => void;
  addExam: (e: Omit<Exam, 'id'>) => void;
  deleteExam: (id: string) => void;
  addTask: (t: Omit<Task, 'id' | 'done'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addAlarm: (a: Omit<Alarm, 'id'>) => void;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  syncNotifications: () => Promise<number>;
  ensurePermission: () => Promise<boolean>;
  permission: string;
  exportData: () => string;
  importData: (json: string) => boolean;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<StoreValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [permission, setPermission] = useState<string>('undetermined');
  const [nowMs, setNowMs] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  // hydrate
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          setState({ ...initialState(), ...parsed, settings: { ...initialState().settings, ...(parsed.settings || {}) } });
        }
      } catch {
        // corrupted storage — start fresh
      } finally {
        setHydrated(true);
      }
      const p = await getPermission();
      setPermission(p);
    })();
    const t = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // persist
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setState((prev) => fn(prev));
  }, []);

  const haptic = useCallback(
    (style: 'light' | 'medium' | 'success' = 'light') => {
      if (!stateRef.current.settings.haptics) return;
      Haptics.impactAsync(
        style === 'success'
          ? Haptics.ImpactFeedbackStyle.Medium
          : style === 'medium'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
    },
    [],
  );

  const syncNotifications = useCallback(async () => {
    const s = stateRef.current;
    if (!s.settings.notifications) {
      await cancelAllScheduled();
      return 0;
    }
    const p = await getPermission();
    setPermission(p);
    if (p !== 'granted') return 0;
    return syncAlarms(s.alarms, s.settings.sound);
  }, []);

  const ensurePermission = useCallback(async () => {
    const ok = await requestPermission();
    const p = await getPermission();
    setPermission(p);
    if (ok) await syncNotifications();
    return ok;
  }, [syncNotifications]);

  const todayKey = toDateKey(new Date(nowMs));
  const nowMin = nowMinutes(new Date(nowMs));

  const completeOnboarding = useCallback(
    async (input: { name: string; grade: Profile['grade']; branch: Profile['branch'] | null; routine: Routine }) => {
      const subjects = defaultSubjects(input.grade, input.branch);
      const alarms = defaultAlarms(input.routine, subjects);
      update((s) => ({
        ...s,
        onboarded: true,
        profile: { name: input.name.trim() || 'طالب', grade: input.grade, branch: input.branch, createdAt: Date.now() },
        routine: input.routine,
        subjects,
        alarms,
        goals: s.goals.length ? s.goals : defaultGoals(),
      }));
      const p = await getPermission();
      setPermission(p);
      if (p === 'granted') setTimeout(() => syncNotifications(), 350);
    },
    [update, syncNotifications],
  );

  const updateProfile = useCallback(
    (patch: Partial<Profile>) => update((s) => (s.profile ? { ...s, profile: { ...s.profile, ...patch } } : s)),
    [update],
  );

  const updateRoutine = useCallback(
    async (r: Routine) => {
      update((s) => {
        const auto = s.alarms.filter((a) => a.kind !== 'custom');
        const custom = s.alarms.filter((a) => a.kind === 'custom');
        return { ...s, routine: r, alarms: [...defaultAlarms(r, s.subjects), ...custom] };
      });
      await syncNotifications();
    },
    [update, syncNotifications],
  );

  const setSubjects = useCallback(
    async (list: Subject[]) => {
      update((s) => {
        const alarms = s.alarms.map((a) => {
          if (a.kind !== 'session') return a;
          const first = list[0];
          if (!first) return a;
          return { ...a, title: `جلسة ${first.name} بدأت ⏱️` };
        });
        return { ...s, subjects: list, alarms };
      });
      await syncNotifications();
    },
    [update, syncNotifications],
  );

  const addSubject = useCallback(
    (s: Omit<Subject, 'id' | 'order'>) =>
      update((prev) => ({ ...prev, subjects: [...prev.subjects, { ...s, id: uid(), order: prev.subjects.length }] })),
    [update],
  );

  const updateSubject = useCallback(
    (id: string, patch: Partial<Subject>) =>
      update((prev) => ({ ...prev, subjects: prev.subjects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
    [update],
  );

  const deleteSubject = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((x) => x.id !== id),
        lessons: prev.lessons.filter((l) => l.subjectId !== id),
      })),
    [update],
  );

  const addLesson = useCallback(
    (subjectId: string, title: string, estMinutes: number) =>
      update((prev) => ({
        ...prev,
        lessons: [...prev.lessons, { id: uid(), subjectId, title, done: false, estMinutes }],
      })),
    [update],
  );

  const toggleLesson = useCallback(
    (id: string) =>
      update((prev) => {
        const lesson = prev.lessons.find((l) => l.id === id);
        if (!lesson) return prev;
        const nowDone = !lesson.done;
        const lessons = prev.lessons.map((l) => (l.id === id ? { ...l, done: nowDone, doneAt: nowDone ? Date.now() : undefined } : l));
        const log = ensureLog(prev, todayKey);
        const lessonsDoneDelta = nowDone ? 1 : -1;
        return {
          ...prev,
          lessons,
          logs: {
            ...prev.logs,
            [todayKey]: { ...log, lessonsDone: Math.max(0, log.lessonsDone + lessonsDoneDelta) },
          },
          meta: { ...prev.meta, lessonsDone: Math.max(0, prev.meta.lessonsDone + lessonsDoneDelta), points: Math.max(0, prev.meta.points + (nowDone ? POINTS.lesson : -POINTS.lesson)) },
        };
      }),
    [update, todayKey],
  );

  const deleteLesson = useCallback(
    (id: string) => update((prev) => ({ ...prev, lessons: prev.lessons.filter((l) => l.id !== id) })),
    [update],
  );

  const completeBlock = useCallback(
    (block: Block, date = todayKey) =>
      update((prev) => {
        const log = ensureLog(prev, date);
        if (log.completedBlockIds.includes(block.id)) return prev;
        const studyDelta = block.type === 'study' ? block.end - block.start : 0;
        const next: DayLog = { ...log, completedBlockIds: [...log.completedBlockIds, block.id] };
        if (block.subjectId && studyDelta > 0) {
          next.subjectMinutes = { ...log.subjectMinutes, [block.subjectId]: (log.subjectMinutes[block.subjectId] || 0) + studyDelta };
        }
        const planned = plannedStudyMinutes(prev.routine);
        const newTotal = next.studyMinutes;
        const goalBonus = planned > 0 && newTotal >= planned && log.studyMinutes < planned ? POINTS.dayGoal : 0;
        next.studyMinutes = newTotal + studyDelta;
        return {
          ...prev,
          logs: { ...prev.logs, [date]: next },
          meta: { ...prev.meta, points: prev.meta.points + (studyDelta > 0 ? 10 : 4) + goalBonus },
        };
      }),
    [update, todayKey],
  );

  const uncompleteBlock = useCallback(
    (blockId: string, date = todayKey) =>
      update((prev) => {
        const log = ensureLog(prev, date);
        return {
          ...prev,
          logs: { ...prev.logs, [date]: { ...log, completedBlockIds: log.completedBlockIds.filter((x) => x !== blockId) } },
        };
      }),
    [update, todayKey],
  );

  const logSession = useCallback(
    (input: { minutes: number; subjectId?: string; lessonId?: string; focus: number; completed: boolean; note?: string; kind: 'pomodoro' | 'manual' }) =>
      update((prev) => {
        const log = ensureLog(prev, todayKey);
        const session: SessionLog = { id: uid(), at: Date.now(), ...input };
        const minutes = input.completed ? input.minutes : Math.round(input.minutes * 0.6);
        const subjectMinutes = input.subjectId
          ? { ...log.subjectMinutes, [input.subjectId]: (log.subjectMinutes[input.subjectId] || 0) + minutes }
          : log.subjectMinutes;
        const planned = plannedStudyMinutes(prev.routine);
        const total = log.studyMinutes + minutes;
        const goalBonus = input.completed && planned > 0 && total >= planned && log.studyMinutes < planned ? POINTS.dayGoal : 0;
        return {
          ...prev,
          logs: {
            ...prev.logs,
            [todayKey]: {
              ...log,
              studyMinutes: total,
              sessions: [...log.sessions, session],
              subjectMinutes,
              pomodoros: log.pomodoros + (input.kind === 'pomodoro' ? 1 : 0),
            },
          },
          meta: {
            ...prev.meta,
            points: prev.meta.points + (input.completed ? POINTS.sessionCompleted : 4) + goalBonus,
            pomodoros: prev.meta.pomodoros + (input.kind === 'pomodoro' ? 1 : 0),
            focusSum: prev.meta.focusSum + input.focus,
            focusCount: prev.meta.focusCount + 1,
          },
        };
      }),
    [update, todayKey],
  );

  const addPomodoro = useCallback(
    (minutes: number, subjectId?: string) =>
      update((prev) => {
        const log = ensureLog(prev, todayKey);
        const subjectMinutes = subjectId
          ? { ...log.subjectMinutes, [subjectId]: (log.subjectMinutes[subjectId] || 0) + minutes }
          : log.subjectMinutes;
        return {
          ...prev,
          logs: { ...prev.logs, [todayKey]: { ...log, studyMinutes: log.studyMinutes + minutes, pomodoros: log.pomodoros + 1, subjectMinutes } },
          meta: { ...prev.meta, points: prev.meta.points + POINTS.pomodoro, pomodoros: prev.meta.pomodoros + 1 },
        };
      }),
    [update, todayKey],
  );

  const markSlept = useCallback(
    () =>
      update((prev) => {
        const log = ensureLog(prev, todayKey);
        if (log.sleptOnTime) return prev;
        return {
          ...prev,
          logs: { ...prev.logs, [todayKey]: { ...log, sleptOnTime: true } },
          meta: { ...prev.meta, nights: prev.meta.nights + 1, points: prev.meta.points + POINTS.sleepOnTime },
        };
      }),
    [update, todayKey],
  );

  const addGoal = useCallback(
    (g: Omit<Goal, 'id' | 'createdAt'>) =>
      update((prev) => ({ ...prev, goals: [...prev.goals, { ...g, id: uid(), createdAt: Date.now() }] })),
    [update],
  );

  const deleteGoal = useCallback(
    (id: string) => update((prev) => ({ ...prev, goals: prev.goals.filter((g) => g.id !== id) })),
    [update],
  );

  const addExam = useCallback(
    (e: Omit<Exam, 'id'>) => update((prev) => ({ ...prev, exams: [...prev.exams, { ...e, id: uid() }] })),
    [update],
  );

  const deleteExam = useCallback(
    (id: string) => update((prev) => ({ ...prev, exams: prev.exams.filter((e) => e.id !== id) })),
    [update],
  );

  const addTask = useCallback(
    (t: Omit<Task, 'id' | 'done'>) => update((prev) => ({ ...prev, tasks: [...prev.tasks, { ...t, id: uid(), done: false }] })),
    [update],
  );

  const toggleTask = useCallback(
    (id: string) =>
      update((prev) => ({ ...prev, tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
    [update],
  );

  const deleteTask = useCallback(
    (id: string) => update((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== id) })),
    [update],
  );

  const addAlarm = useCallback(
    (a: Omit<Alarm, 'id'>) =>
      update((prev) => {
        const next = { ...prev, alarms: [...prev.alarms, { ...a, id: uid() }] };
        return next;
      }),
    [update],
  );

  const updateAlarm = useCallback(
    (id: string, patch: Partial<Alarm>) =>
      update((prev) => ({ ...prev, alarms: prev.alarms.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
    [update],
  );

  const deleteAlarm = useCallback(
    (id: string) => update((prev) => ({ ...prev, alarms: prev.alarms.filter((a) => a.id !== id) })),
    [update],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => update((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } })),
    [update],
  );

  // resync scheduled notifications whenever the alarm set or sound changes
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => syncNotifications(), 600);
    return () => clearTimeout(t);
  }, [hydrated, state.alarms, state.settings.notifications, state.settings.sound, syncNotifications]);

  const getBlocksForDate = useCallback(
    (dateKey: string) => {
      const s = stateRef.current;
      const d = new Date(dateKey);
      const plan = getDayPlan(s.routine, s.subjects, s.lessons, d.getDay(), dateKey);
      return plan.blocks;
    },
    [state.routine, state.subjects, state.lessons],
  );

  const todayPlan = useMemo(
    () => getDayPlan(state.routine, state.subjects, state.lessons, new Date(nowMs).getDay(), todayKey),
    [state.routine, state.subjects, state.lessons, todayKey, nowMs],
  );

  const todayLog = state.logs[todayKey] || emptyLog(todayKey);

  const dayStats = useMemo(() => {
    const planned = todayPlan.plannedMinutes;
    const done = todayLog.studyMinutes;
    const doneBlocks = todayPlan.blocks.filter((b) => todayLog.completedBlockIds.includes(b.id)).length;
    const next = todayPlan.blocks.find((b) => b.end > nowMin && !todayLog.completedBlockIds.includes(b.id));
    return {
      planned,
      done,
      pct: planned > 0 ? Math.min(1, done / planned) : 0,
      next,
      blocksDone: doneBlocks,
      blocksTotal: todayPlan.blocks.filter((b) => b.type !== 'sleep').length,
    };
  }, [todayPlan, todayLog, nowMin]);

  const week = useMemo(() => {
    const d = new Date(nowMs);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const out: { date: string; minutes: number; planned: number; done: boolean }[] = [];
    for (let i = -3; i <= 3; i++) {
      const day = new Date(start.getTime() + i * 86400000);
      const key = toDateKey(day);
      const log = state.logs[key];
      const plan = getDayPlan(state.routine, state.subjects, state.lessons, day.getDay(), key);
      out.push({ date: key, minutes: log?.studyMinutes || 0, planned: plan.plannedMinutes, done: (log?.studyMinutes || 0) >= plan.plannedMinutes && plan.plannedMinutes > 0 });
    }
    return out;
  }, [state.logs, state.routine, state.subjects, state.lessons, nowMs]);

  const weekMinutes = useMemo(
    () => Object.keys(state.logs)
      .filter((k) => week.some((w) => w.date === k))
      .reduce((acc, k) => acc + (state.logs[k]?.studyMinutes || 0), 0),
    [state.logs, week],
  );

  const topSubjectId = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.values(state.logs).forEach((l) => {
      Object.entries(l.subjectMinutes || {}).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
    });
    let best: string | undefined;
    let bestVal = 0;
    Object.entries(totals).forEach(([k, v]) => {
      if (v > bestVal) {
        bestVal = v;
        best = k;
      }
    });
    return best;
  }, [state.logs]);

  const stats: StatsSnapshot = useMemo(() => {
    const logs = Object.values(state.logs);
    const totalMinutes = logs.reduce((a, l) => a + l.studyMinutes, 0);
    const daysLogged = logs.filter((l) => l.studyMinutes > 0 || l.completedBlockIds.length > 0).length;
    // streak: walk backwards from today
    let streak = 0;
    const cursor = new Date(nowMs);
    for (let i = 0; i < 400; i++) {
      const key = toDateKey(cursor);
      const log = state.logs[key];
      const plan = getDayPlan(state.routine, state.subjects, state.lessons, cursor.getDay(), key);
      const target = plan.isStudyDay ? Math.min(plannedStudyMinutes(state.routine) * 0.6, 180) : 30;
      const ok = log ? log.studyMinutes >= target || (plan.isStudyDay ? false : log.completedBlockIds.length > 0) : false;
      if (ok) {
        streak += 1;
      } else if (i === 0) {
        // today not finished yet — don't break the streak, check yesterday
      } else {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    const allDays = logs.map((l) => l.date).sort();
    let bestStreak = 0;
    let run = 0;
    let prevTime: number | null = null;
    allDays.forEach((k) => {
      const t = new Date(k).getTime();
      if (prevTime !== null && Math.round((t - prevTime) / 86400000) === 1) run += 1;
      else run = 1;
      prevTime = t;
      const log = state.logs[k];
      if (log.studyMinutes > 0) bestStreak = Math.max(bestStreak, run);
    });
    bestStreak = Math.max(bestStreak, streak);
    const focusAvg = state.meta.focusCount ? state.meta.focusSum / state.meta.focusCount : 0;
    return {
      totalMinutes,
      pomodoros: state.meta.pomodoros,
      lessonsDone: state.meta.lessonsDone,
      streak,
      bestStreak,
      daysLogged,
      nights: state.meta.nights,
      focusAvg,
      level: levelFor(state.meta.points).level,
    };
  }, [state.logs, state.meta, state.routine, state.subjects, state.lessons, nowMs]);

  const levelInfo = useMemo(() => levelFor(state.meta.points), [state.meta.points]);

  const goalProgress = useCallback(
    (g: Goal) => {
      if (g.kind === 'dailyHours') {
        const value = todayLog.studyMinutes / 60;
        return { value, pct: Math.min(1, value / Math.max(0.5, g.target)), label: `${value.toFixed(1)} / ${g.target} ساعة` };
      }
      if (g.kind === 'weeklyLessons') {
        const weekStart = new Date(nowMs);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const value = Object.values(state.logs)
          .filter((l) => new Date(l.date).getTime() >= weekStart.setHours(0, 0, 0, 0))
          .reduce((a, l) => a + l.lessonsDone, 0);
        return { value, pct: Math.min(1, value / Math.max(1, g.target)), label: `${value} / ${g.target} درس` };
      }
      if (g.kind === 'streak') {
        return { value: stats.streak, pct: Math.min(1, stats.streak / Math.max(1, g.target)), label: `${stats.streak} / ${g.target} يوم` };
      }
      if (g.kind === 'pomodoros') {
        return { value: stats.pomodoros, pct: Math.min(1, stats.pomodoros / Math.max(1, g.target)), label: `${stats.pomodoros} / ${g.target} جلسة` };
      }
      return { value: 0, pct: 0, label: g.unit || '' };
    },
    [todayLog.studyMinutes, state.logs, stats, nowMs],
  );

  const exportData = useCallback(() => JSON.stringify(stateRef.current), [state]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as AppState;
      if (!parsed || typeof parsed !== 'object' || !parsed.routine) return false;
      setState({ ...initialState(), ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetAll = useCallback(async () => {
    await cancelAllScheduled();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(initialState());
  }, []);

  const theme = state.settings.theme === 'dark' || (state.settings.theme === 'system' && scheme === 'dark') ? darkTheme : lightTheme;

  const value: StoreValue = {
    state,
    hydrated,
    theme,
    todayKey,
    nowMin,
    todayLog,
    todayBlocks: todayPlan.blocks,
    dayPlanPlanned: todayPlan.plannedMinutes,
    dayStats,
    week,
    weekMinutes,
    topSubjectId,
    stats,
    levelInfo,
    goalProgress,
    getBlocksForDate,
    haptic,
    completeOnboarding,
    updateProfile,
    updateRoutine,
    setSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    addLesson,
    toggleLesson,
    deleteLesson,
    completeBlock,
    uncompleteBlock,
    logSession,
    addPomodoro,
    markSlept,
    addGoal,
    deleteGoal,
    addExam,
    deleteExam,
    addTask,
    toggleTask,
    deleteTask,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    updateSettings,
    syncNotifications,
    ensurePermission,
    permission,
    exportData,
    importData,
    resetAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): StoreValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function isStudyDayFor(routine: Routine, weekday: number): boolean {
  return isStudyDay(routine, weekday);
}
