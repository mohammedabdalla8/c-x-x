import { Block, Lesson, Routine, Subject } from './types';

const MIN_SESSION = 45;
const SESSION_LEN = 90;
const SHORT_BREAK = 15;
const LONG_BREAK = 30;
const LONG_AFTER = 4;

export function plannedStudyMinutes(routine: Routine): number {
  return Math.round(routine.studyHours * 60);
}

export function isStudyDay(routine: Routine, weekday: number): boolean {
  return routine.studyDays.includes(weekday);
}

interface Timed {
  start: number;
  end: number;
}

/** Free time windows between fixed routine anchors, where study blocks may go. */
function windowsBetween(fixed: Timed[], from: number, until: number): Timed[] {
  const sorted = [...fixed].sort((a, b) => a.start - b.start);
  const out: Timed[] = [];
  let cursor = from;
  for (const f of sorted) {
    if (f.start > cursor) out.push({ start: cursor, end: Math.min(f.start, until) });
    cursor = Math.max(cursor, f.end);
    if (cursor >= until) break;
  }
  if (cursor < until) out.push({ start: cursor, end: until });
  return out.filter((w) => w.end - w.start >= MIN_SESSION);
}

/** Weighted subject rotation — higher priority + more weekly hours = more slots (interleaved). */
function subjectQueue(subjects: Subject[]): Subject[] {
  const sorted = [...subjects].sort((a, b) => b.priority - a.priority || b.hoursPerWeek - a.hoursPerWeek);
  const weights = sorted.map((s) => Math.max(1, Math.min(4, Math.round(s.hoursPerWeek / 2))));
  const queue: Subject[] = [];
  let remaining = weights.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (remaining > 0 && guard < 12) {
    for (let i = 0; i < sorted.length && remaining > 0; i++) {
      if (weights[i] > 0) {
        queue.push(sorted[i]);
        weights[i] -= 1;
        remaining -= 1;
      }
    }
    guard += 1;
  }
  return queue.length ? queue : sorted;
}

function nextLessonFor(lessons: Lesson[], subjectId?: string): Lesson | undefined {
  if (!subjectId) return undefined;
  return lessons.filter((l) => l.subjectId === subjectId && !l.done)[0];
}

export interface DayPlan {
  blocks: Block[];
  plannedMinutes: number;
  allocatedMinutes: number;
  isStudyDay: boolean;
}

/**
 * Smart day generator — builds the full day from the student's routine,
 * guaranteeing study blocks never overlap sleep, meals or exercise.
 */
export function generateDay(
  routine: Routine,
  subjects: Subject[],
  lessons: Lesson[],
  weekday: number,
  dateKey: string,
): DayPlan {
  const blocks: Block[] = [];
  const id = (type: string, start: number) => `${dateKey}#${type}#${start}`;
  const wake = routine.wakeUp;
  const sleep = Math.max(wake + 8 * 60, routine.sleep);
  const study = isStudyDay(routine, weekday);

  if (wake > 0) blocks.push({ id: id('sleep', 0), type: 'sleep', title: 'النوم', start: 0, end: wake });
  blocks.push({ id: id('wake', wake), type: 'wake', title: 'الاستيقاظ والتمارين الصباحية', start: wake, end: wake + 30 });
  blocks.push({ id: id('meal', wake + 30), type: 'meal', title: 'الإفطار والاستعداد', start: wake + 30, end: wake + 60 });

  const anchorStart = wake + 60;
  const lunchStart = Math.max(routine.lunchTime, anchorStart + 60);
  const lunchEnd = lunchStart + 60;
  const exStart = Math.max(routine.exerciseTime, lunchEnd + 30);
  const exEnd = exStart + routine.exerciseDuration;
  const showerEnd = exEnd + 45;
  const reviewStart = sleep - 75;
  const prepStart = sleep - 30;
  const lastStudyEnd = routine.reviewEnabled ? reviewStart : prepStart;

  const fixed: Timed[] = [
    { start: wake, end: wake + 60 },
    { start: lunchStart, end: lunchEnd },
    { start: exStart, end: showerEnd },
    { start: prepStart, end: sleep },
  ];

  blocks.push({ id: id('exercise', exStart), type: 'exercise', title: 'تمارين رياضية', note: 'نشاط بدني يرفع التركيز', start: exStart, end: exEnd });
  blocks.push({ id: id('rest', exEnd), type: 'rest', title: 'استحمام واستراحة', start: exEnd, end: showerEnd });
  blocks.push({ id: id('meal', lunchStart), type: 'meal', title: 'الغداء والراحة', start: lunchStart, end: lunchEnd });
  blocks.push({ id: id('prep', prepStart), type: 'prep', title: 'الاستعداد للنوم', start: prepStart, end: sleep });
  if (sleep < 1440) blocks.push({ id: id('sleep', sleep), type: 'sleep', title: 'النوم', start: sleep, end: 1440 });

  let plannedMinutes = 0;
  let allocated = 0;

  if (study) {
    plannedMinutes = plannedStudyMinutes(routine);
    const windows = windowsBetween(fixed, Math.max(routine.studyStart, anchorStart), lastStudyEnd);
    let remaining = plannedMinutes;
    let sessionIndex = 0;
    let qi = 0;
    const queue = subjectQueue(subjects);

    const totalFree = windows.reduce((a, w) => a + (w.end - w.start), 0) || 1;
    const slots = windows.map((w) => ({ w, cursor: w.start, used: 0 }));

    const place = (slot: { w: Timed; cursor: number; used: number }): boolean => {
      const len = Math.min(SESSION_LEN, remaining, slot.w.end - slot.cursor);
      if (len < MIN_SESSION) return false;
      const subj = queue.length ? queue[qi % queue.length] : undefined;
      qi += 1;
      const lesson = nextLessonFor(lessons, subj?.id);
      blocks.push({
        id: id('study', slot.cursor),
        type: 'study',
        title: `جلسة مذاكرة — ${subj ? subj.name : 'دراسة'}`,
        note: lesson ? `الدرس التالي: ${lesson.title}` : undefined,
        start: slot.cursor,
        end: slot.cursor + len,
        subjectId: subj?.id,
        subjectName: subj?.name,
      });
      remaining -= len;
      allocated += len;
      slot.cursor += len;
      slot.used += len;
      sessionIndex += 1;
      if (slot.cursor < slot.w.end && remaining >= MIN_SESSION) {
        const isLong = sessionIndex % LONG_AFTER === 0;
        const bl = isLong ? LONG_BREAK : SHORT_BREAK;
        if (slot.cursor + bl + MIN_SESSION <= slot.w.end) {
          blocks.push({
            id: id('rest', slot.cursor),
            type: 'rest',
            title: isLong ? 'راحة طويلة ☕' : 'استراحة قصيرة',
            start: slot.cursor,
            end: slot.cursor + bl,
          });
          slot.cursor += bl;
        }
      }
      return true;
    };

    // Pass 1 — spread the study load proportionally across every free window
    for (const slot of slots) {
      const budget = Math.max(MIN_SESSION, Math.round((plannedMinutes * (slot.w.end - slot.w.start)) / totalFree));
      let localGuard = 0;
      while (remaining >= MIN_SESSION && slot.used + Math.min(SESSION_LEN, remaining) <= budget && localGuard < 8) {
        localGuard += 1;
        if (!place(slot)) break;
      }
    }

    // Pass 2 — leftover minutes go into whichever window still has the most room
    let guard = 0;
    while (remaining >= MIN_SESSION && guard < 24) {
      guard += 1;
      const candidates = slots.filter((s) => s.w.end - s.cursor >= MIN_SESSION);
      if (candidates.length === 0) break;
      candidates.sort((a, b) => b.w.end - b.cursor - (a.w.end - a.cursor));
      if (!place(candidates[0])) break;
    }

    if (routine.reviewEnabled && lastStudyEnd > reviewStart + 10) {
      blocks.push({
        id: id('review', reviewStart),
        type: 'review',
        title: 'مراجعة خفيفة',
        note: 'راجع ملخص اليوم وحدودك القادمة',
        start: reviewStart,
        end: reviewStart + 30,
      });
    }
  } else {
    const freeStart = Math.max(routine.studyStart, anchorStart);
    if (lunchStart - freeStart >= 45) {
      blocks.push({
        id: id('study', freeStart),
        type: 'study',
        title: 'جلسة مراجعة خفيفة (اختيارية)',
        note: 'يوم راحة — راجع فقط ما فاتك',
        start: freeStart,
        end: Math.min(freeStart + 45, lunchStart),
      });
    }
    if (showerEnd < prepStart - 30) {
      blocks.push({ id: id('free', showerEnd), type: 'free', title: 'وقت حر / هواية', start: showerEnd, end: prepStart });
    }
  }

  blocks.sort((a, b) => a.start - b.start);
  return { blocks, plannedMinutes, allocatedMinutes: allocated, isStudyDay: study };
}

export const dayPlanCache = new Map<string, DayPlan>();

export function getDayPlan(
  routine: Routine,
  subjects: Subject[],
  lessons: Lesson[],
  weekday: number,
  dateKey: string,
): DayPlan {
  const key = `${dateKey}|${routine.studyHours}|${routine.wakeUp}|${routine.sleep}|${routine.studyStart}|${routine.exerciseTime}|${routine.exerciseDuration}|${routine.lunchTime}|${routine.studyDays.join(',')}|${routine.reviewEnabled}|${subjects.map((s) => `${s.id}:${s.priority}:${s.hoursPerWeek}:${s.name}`).join(',')}|${lessons.filter((l) => !l.done).slice(0, 3).map((l) => l.title).join(',')}`;
  const hit = dayPlanCache.get(key);
  if (hit) return hit;
  const plan = generateDay(routine, subjects, lessons, weekday, dateKey);
  if (dayPlanCache.size > 60) dayPlanCache.clear();
  dayPlanCache.set(key, plan);
  return plan;
}

/** Finds a free slot later today to compensate a missed study session. */
export function findReplacement(
  routine: Routine,
  blocks: Block[],
  completedIds: string[],
  nowMin: number,
): { start: number; end: number; reason: string } | null {
  const sleepLimit = routine.sleep - 30;
  const missed = blocks.filter(
    (b) => b.type === 'study' && b.end <= nowMin && !completedIds.includes(b.id),
  );
  if (missed.length === 0) return null;

  const busy = blocks
    .filter((b) => b.type !== 'sleep' && b.type !== 'free')
    .map((b) => ({ start: b.start, end: b.end }))
    .sort((a, b) => a.start - b.start);

  const gaps: Timed[] = [];
  let cursor = nowMin;
  for (const b of busy) {
    if (b.end <= cursor) continue;
    if (b.start > cursor) gaps.push({ start: cursor, end: b.start });
    cursor = Math.max(cursor, b.end);
  }
  if (cursor < sleepLimit) gaps.push({ start: cursor, end: sleepLimit });

  const best = gaps
    .map((g) => ({ ...g, len: g.end - g.start }))
    .filter((g) => g.len >= 45)
    .sort((a, b) => a.start - b.start)[0]
    || gaps
      .map((g) => ({ ...g, len: g.end - g.start }))
      .filter((g) => g.len >= 30)
      .sort((a, b) => a.start - b.start)[0];

  if (best) {
    const len = Math.min(45, best.len);
    return {
      start: best.start,
      end: best.start + len,
      reason: `فاتتك جلسة ${missed.length > 0 ? `«${missed[0].subjectName || 'مذاكرة'}»` : 'مذاكرة'} — نقترح تعويضها في هذا الوقت.`,
    };
  }

  const rest = blocks.find((b) => b.type === 'rest' && b.end > nowMin && b.end - b.start >= 30);
  if (rest) {
    const start = Math.max(rest.start, nowMin);
    if (rest.end - start >= 30) {
      return { start, end: start + 30, reason: 'يمكنك تحويل جزء من وقت الراحة لجلسة تعويضية.' };
    }
  }
  return null;
}

/** Fitness check used in onboarding: is there enough room for the requested study hours? */
export function availableStudyMinutes(routine: Routine): number {
  const wake = routine.wakeUp;
  const sleep = Math.max(wake + 8 * 60, routine.sleep);
  const anchorStart = wake + 60;
  const lunchStart = Math.max(routine.lunchTime, anchorStart + 60);
  const exStart = Math.max(routine.exerciseTime, lunchStart + 90);
  const exEnd = exStart + routine.exerciseDuration + 45;
  const lastStudyEnd = (routine.reviewEnabled ? sleep - 75 : sleep - 30) - anchorStart;
  const morning = Math.max(0, lunchStart - anchorStart);
  const afternoon = Math.max(0, exStart - lunchStart - 60);
  const evening = Math.max(0, sleep - 30 - exEnd - (routine.reviewEnabled ? 45 : 0));
  return Math.max(0, morning + afternoon + evening - lastStudyEnd * 0);
}
