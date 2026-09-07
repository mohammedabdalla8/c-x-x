import { Alarm, Branch, Grade, Goal, Routine, Subject } from './types';
import { PALETTE } from './theme';
import { uid } from './ids';

export const GRADE_LABELS: Record<Grade, string> = {
  first: 'الصف الأول الثانوي',
  second: 'الصف الثاني الثانوي',
  third: 'الصف الثالث الثانوي',
};

export const BRANCH_LABELS: Record<Branch, string> = {
  'sci-bio': 'علمي — علوم',
  'sci-math': 'علمي — رياضة',
  arts: 'أدبي',
};

export const SUBJECT_COLORS = [
  PALETTE.primary, PALETTE.teal, PALETTE.amber, PALETTE.rose,
  PALETTE.purple, PALETTE.sky, PALETTE.green, '#F97316', '#0EA5E9', '#E11D48',
];

export const SUBJECT_ICONS = [
  'book', 'flask', 'calculator', 'leaf', 'planet', 'earth',
  'language', 'bulb', 'musical-notes', 'color-palette', 'code-slash', 'library',
];

export function defaultRoutine(): Routine {
  return {
    wakeUp: 6 * 60,
    sleep: 23 * 60,
    studyStart: 7 * 60 + 30,
    studyHours: 4,
    lunchTime: 13 * 60,
    exerciseTime: 16 * 60,
    exerciseDuration: 60,
    studyDays: [0, 1, 2, 3, 4],
    reviewEnabled: true,
  };
}

interface Seed {
  name: string;
  icon: string;
  color: string;
  hours: number;
  priority: 1 | 2 | 3;
}

const CORE: Seed[] = [
  { name: 'اللغة العربية', icon: 'book', color: PALETTE.primary, hours: 4, priority: 3 },
  { name: 'اللغة الإنجليزية', icon: 'language', color: PALETTE.sky, hours: 4, priority: 3 },
  { name: 'اللغة الثالثة / المهارات', icon: 'color-palette', color: PALETTE.purple, hours: 2, priority: 1 },
];

const SCI: Seed[] = [
  { name: 'الفيزياء', icon: 'planet', color: PALETTE.teal, hours: 5, priority: 3 },
  { name: 'الكيمياء', icon: 'flask', color: PALETTE.amber, hours: 5, priority: 3 },
  { name: 'الأحياء', icon: 'leaf', color: PALETTE.green, hours: 4, priority: 2 },
];

const MATH: Seed[] = [
  { name: 'الرياضيات', icon: 'calculator', color: PALETTE.rose, hours: 6, priority: 3 },
];

const ARTS: Seed[] = [
  { name: 'التاريخ', icon: 'earth', color: PALETTE.amber, hours: 5, priority: 3 },
  { name: 'الجغرافيا', icon: 'globe', color: PALETTE.teal, hours: 5, priority: 3 },
  { name: 'الفلسفة والمنطق', icon: 'bulb', color: PALETTE.purple, hours: 4, priority: 2 },
];

const RELIGION: Seed = { name: 'التربية الإسلامية', icon: 'moon', color: '#0F766E', hours: 2, priority: 2 };
const GEOLOGY: Seed = { name: 'الجيولوجيا', icon: 'diamond', color: '#A16207', hours: 3, priority: 2 };
const PSYCH: Seed = { name: 'علم النفس والاجتماع', icon: 'heart', color: '#DB2777', hours: 3, priority: 2 };

export function defaultSubjects(grade: Grade, branch: Branch | null): Subject[] {
  let seeds: Seed[] = [...CORE];
  if (grade === 'first' || grade === 'second') {
    seeds = [...CORE, ...SCI, ...MATH];
  } else if (branch === 'sci-bio') {
    seeds = [...CORE, ...SCI, ...MATH, GEOLOGY, RELIGION];
  } else if (branch === 'sci-math') {
    seeds = [...CORE, ...SCI, ...MATH, RELIGION];
  } else {
    seeds = [...CORE, ...ARTS, PSYCH, RELIGION];
  }
  return seeds.map((s, i) => ({
    id: uid(),
    name: s.name,
    icon: s.icon,
    color: s.color,
    hoursPerWeek: s.hours,
    priority: s.priority,
    order: i,
  }));
}

export function defaultGoals(): Goal[] {
  const now = Date.now();
  return [
    { id: uid(), title: 'أذاكر ٤ ساعات يومياً', kind: 'dailyHours', target: 4, unit: 'ساعة', icon: 'timer', createdAt: now },
    { id: uid(), title: 'أنهي ١٢ درساً هذا الأسبوع', kind: 'weeklyLessons', target: 12, unit: 'درس', icon: 'checkmark-done', createdAt: now },
    { id: uid(), title: 'سلسلة ٧ أيام ملتزمة', kind: 'streak', target: 7, unit: 'يوم', icon: 'flame', createdAt: now },
  ];
}

export const SOUND_OPTIONS = [
  { id: 'classic', label: 'منبه كلاسيكي' },
  { id: 'gentle', label: 'نغمة هادئة' },
  { id: 'energetic', label: 'نشيط ومقوٍ' },
  { id: 'chime', label: 'أجراس دراسية' },
];

export function defaultAlarms(routine: Routine, subjects: Subject[]): Alarm[] {
  const studyDays = routine.studyDays.length ? routine.studyDays : [0, 1, 2, 3, 4];
  const mk = (
    kind: Alarm['kind'],
    title: string,
    body: string,
    time: number,
    days: number[],
  ): Alarm => ({
    id: uid(),
    title,
    body,
    time,
    days,
    enabled: true,
    sound: 'classic',
    vibrate: true,
    kind,
    snoozeMinutes: 10,
  });

  const list: Alarm[] = [
    mk('wake', 'حان وقت الاستيقاظ ☀️', 'صباح الخير! يومك المدرسي يبدأ الآن.', routine.wakeUp, [0, 1, 2, 3, 4, 5, 6]),
    mk('study', 'حان وقت بدء المذاكرة 📚', 'ابدأ أول جلسة دراسة اليوم بتركيز عالٍ.', routine.studyStart, studyDays),
  ];

  const firstStudy = subjects[0];
  if (firstStudy) {
    list.push(
      mk(
        'session',
        `جلسة ${firstStudy.name} بدأت ⏱️`,
        'جلسة التركيز بدأت — اقفل الإشعارات وركّز لمدة ٩٠ دقيقة.',
        routine.studyStart + 60,
        studyDays,
      ),
    );
  }

  list.push(
    mk('exercise', 'حان وقت التمارين الرياضية 🏃', 'حرّك جسمك ٣٠–٦٠ دقيقة، سيزيد تركيزك كثيراً.', routine.exerciseTime, studyDays),
  );
  if (routine.reviewEnabled) {
    list.push(mk('review', 'مراجعة خفيفة قبل النوم 🌙', 'راجع ملخص اليوم بهدوء قبل النوم.', routine.sleep - 75, studyDays));
  }
  list.push(mk('sleep', 'اقترب موعد النوم 😴', 'جهّز نفسك للنوم في الموعد المحدد.', routine.sleep - 30, studyDays));
  return list;
}
