export type Grade = 'first' | 'second' | 'third';
export type Branch = 'sci-bio' | 'sci-math' | 'arts';

export interface Profile {
  name: string;
  grade: Grade;
  branch: Branch | null;
  createdAt: number;
}

export interface Routine {
  wakeUp: number; // minutes from midnight
  sleep: number;
  studyStart: number;
  studyHours: number;
  lunchTime: number;
  exerciseTime: number;
  exerciseDuration: number;
  studyDays: number[]; // 0 = Sunday
  reviewEnabled: boolean;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  hoursPerWeek: number;
  priority: 1 | 2 | 3; // 1 low .. 3 high
  order: number;
}

export interface Lesson {
  id: string;
  subjectId: string;
  title: string;
  done: boolean;
  doneAt?: number;
  estMinutes: number;
}

export type BlockType = 'sleep' | 'wake' | 'meal' | 'study' | 'rest' | 'exercise' | 'review' | 'prep' | 'free';

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  note?: string;
  start: number;
  end: number;
  subjectId?: string;
  subjectName?: string;
}

export interface SessionLog {
  id: string;
  subjectId?: string;
  lessonId?: string;
  minutes: number;
  focus: number; // 1..5
  completed: boolean;
  note?: string;
  at: number;
  kind: 'pomodoro' | 'manual';
}

export interface DayLog {
  date: string;
  studyMinutes: number;
  completedBlockIds: string[];
  sessions: SessionLog[];
  subjectMinutes: Record<string, number>;
  pomodoros: number;
  lessonsDone: number;
  sleptOnTime?: boolean;
}

export type GoalKind = 'dailyHours' | 'weeklyLessons' | 'streak' | 'pomodoros' | 'custom';

export interface Goal {
  id: string;
  title: string;
  kind: GoalKind;
  target: number;
  unit?: string;
  icon?: string;
  createdAt: number;
}

export interface Exam {
  id: string;
  title: string;
  subjectId?: string;
  date: string; // YYYY-MM-DD
  time: number;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  done: boolean;
}

export interface Alarm {
  id: string;
  title: string;
  body: string;
  time: number;
  days: number[];
  enabled: boolean;
  sound: string;
  vibrate: boolean;
  kind: 'wake' | 'study' | 'exercise' | 'review' | 'sleep' | 'session' | 'custom';
  snoozeMinutes: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  sound: string;
  notifications: boolean;
  haptics: boolean;
  lastBackupAt?: number;
}

export interface Meta {
  points: number;
  pomodoros: number;
  lessonsDone: number;
  focusSum: number;
  focusCount: number;
  nights: number;
}

export interface AppState {
  version: number;
  onboarded: boolean;
  profile: Profile | null;
  routine: Routine;
  subjects: Subject[];
  lessons: Lesson[];
  logs: Record<string, DayLog>;
  goals: Goal[];
  exams: Exam[];
  tasks: Task[];
  alarms: Alarm[];
  settings: Settings;
  meta: Meta;
}
