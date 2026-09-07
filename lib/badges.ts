export interface StatsSnapshot {
  totalMinutes: number;
  pomodoros: number;
  lessonsDone: number;
  streak: number;
  bestStreak: number;
  daysLogged: number;
  nights: number;
  focusAvg: number;
  level: number;
}

export interface BadgeDef {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  value: number;
  target: number;
}

interface BadgeSeed {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  target: number;
}

export const BADGES: BadgeSeed[] = [
  { id: 'first', title: 'أول خطوة', desc: 'أنهيت أول جلسة تركيز', icon: 'flag', color: '#5B67F1', target: 1 },
  { id: 'streak3', title: '٣ أيام ملتزمة', desc: 'التزمت ٣ أيام متتالية', icon: 'flame', color: '#F5A524', target: 3 },
  { id: 'streak7', title: 'أسبوع ذهبي', desc: 'سلسلة التزام ٧ أيام', icon: 'flame', color: '#F97316', target: 7 },
  { id: 'streak30', title: 'شهر من الانضباط', desc: 'سلسلة التزام ٣٠ يوماً', icon: 'planet', color: '#9B5CF6', target: 30 },
  { id: 'pomo10', title: 'تركيز عميق', desc: '١٠ جلسات بومودورو', icon: 'timer', color: '#12B5A0', target: 10 },
  { id: 'pomo30', title: 'آلة بومودورو', desc: '٣٠ جلسة بومودورو', icon: 'rocket', color: '#38B6FF', target: 30 },
  { id: 'lessons10', title: 'بطل الدروس', desc: 'أنهيت ١٠ دروس كاملة', icon: 'checkmark-done', color: '#25C16F', target: 10 },
  { id: 'lessons40', title: 'مكتبة المعرفة', desc: 'أنهيت ٤٠ درساً', icon: 'library', color: '#0EA5E9', target: 40 },
  { id: 'hours50', title: '٥٠ ساعة تركيز', desc: 'مجموع ٥٠ ساعة مذاكرة', icon: 'hourglass', color: '#F2557E', target: 3000 },
  { id: 'hours100', title: 'مئوية الساعات', desc: 'مجموع ١٠٠ ساعة مذاكرة', icon: 'medal', color: '#E11D48', target: 6000 },
  { id: 'sleep7', title: 'روتين صحي', desc: 'نمت بالموعد ٧ أيام', icon: 'bed', color: '#6366F1', target: 7 },
  { id: 'days30', title: 'سجل مثابر', desc: 'سجّلت إنجازك ٣٠ يوماً', icon: 'stats-chart', color: '#0F766E', target: 30 },
];

export function computeBadges(s: StatsSnapshot): (BadgeDef & { earned: boolean })[] {
  const values: Record<string, number> = {
    first: s.pomodoros >= 1 || s.totalMinutes > 0 ? 1 : 0,
    streak3: s.bestStreak >= 3 ? 3 : s.bestStreak,
    streak7: s.bestStreak >= 7 ? 7 : s.bestStreak,
    streak30: s.bestStreak >= 30 ? 30 : s.bestStreak,
    pomo10: Math.min(10, s.pomodoros),
    pomo30: Math.min(30, s.pomodoros),
    lessons10: Math.min(10, s.lessonsDone),
    lessons40: Math.min(40, s.lessonsDone),
    hours50: Math.min(3000, s.totalMinutes),
    hours100: Math.min(6000, s.totalMinutes),
    sleep7: Math.min(7, s.nights),
    days30: Math.min(30, s.daysLogged),
  };
  return BADGES.map((b) => ({
    ...b,
    value: values[b.id] ?? 0,
    earned: (values[b.id] ?? 0) >= b.target,
  }));
}

export const POINTS = {
  pomodoro: 12,
  sessionCompleted: 18,
  lesson: 25,
  dayGoal: 40,
  sleepOnTime: 8,
};

export function levelFor(points: number): { level: number; progress: number; toNext: number; current: number } {
  const perLevel = 300;
  const level = Math.floor(points / perLevel) + 1;
  const current = points % perLevel;
  return { level, progress: current / perLevel, toNext: perLevel - current, current };
}
