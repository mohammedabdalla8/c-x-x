import { NavigatorScreenParams } from '@react-navigation/native';
import { Branch, Grade } from './types';

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Grade: { name?: string } | undefined;
  Branch: { name: string; grade: Grade };
  Routine: { name: string; grade: Grade; branch: Branch } | undefined;
  Main: NavigatorScreenParams<TabParamList> | undefined;
  Today: undefined;
  Week: { date?: string } | undefined;
  Subjects: undefined;
  SubjectDetail: { subjectId: string };
  Focus: { subjectId?: string; lessonId?: string } | undefined;
  SessionSummary: { minutes: number; subjectId?: string; lessonId?: string; pomodoros: number };
  Calendar: { date?: string } | undefined;
  Stats: undefined;
  Goals: undefined;
  Achievements: undefined;
  Alarms: undefined;
  Settings: undefined;
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  TodayTab: undefined;
  FocusTab: undefined;
  CalendarTab: undefined;
  More: undefined;
};
