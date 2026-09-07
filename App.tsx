import React, { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { AppProvider, useApp } from './lib/store';
import { RootStackParamList, TabParamList } from './lib/nav';
import { snoozeIncoming } from './lib/notifications';
import { F, shadow } from './lib/theme';

import SplashScreen from './screens/SplashScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import GradeScreen from './screens/GradeScreen';
import BranchScreen from './screens/BranchScreen';
import RoutineScreen from './screens/RoutineScreen';
import DashboardScreen from './screens/DashboardScreen';
import TodayScreen from './screens/TodayScreen';
import WeekScreen from './screens/WeekScreen';
import MoreScreen from './screens/MoreScreen';
import SubjectsScreen from './screens/SubjectsScreen';
import SubjectDetailScreen from './screens/SubjectDetailScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import FocusScreen from './screens/FocusScreen';
import SessionSummaryScreen from './screens/SessionSummaryScreen';
import CalendarScreen from './screens/CalendarScreen';
import StatsScreen from './screens/StatsScreen';
import GoalsScreen from './screens/GoalsScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import AlarmsScreen from './screens/AlarmsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function makeStack(screens: { name: string; comp: React.ComponentType<any> }[]) {
  const Comp = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_left' }}>
      {screens.map((s) => (
        <Stack.Screen key={s.name} name={s.name as never} component={s.comp} />
      ))}
    </Stack.Navigator>
  );
  return Comp;
}

const HomeStack = makeStack([{ name: 'DashboardHome', comp: DashboardScreen }]);
const TodayStack = makeStack([{ name: 'TodayMain', comp: TodayScreen }]);
const FocusStack = makeStack([{ name: 'FocusHome', comp: PomodoroScreen }]);
const CalendarStack = makeStack([{ name: 'CalendarHome', comp: CalendarScreen }]);
const MoreStack = makeStack([{ name: 'MoreHome', comp: MoreScreen }]);

const TABS: { name: keyof TabParamList; comp: React.ComponentType<any>; icon: string; label: string }[] = [
  { name: 'Home', comp: HomeStack, icon: 'home', label: 'الرئيسية' },
  { name: 'TodayTab', comp: TodayStack, icon: 'time', label: 'جدولي' },
  { name: 'FocusTab', comp: FocusStack, icon: 'timer', label: 'تركيز' },
  { name: 'CalendarTab', comp: CalendarStack, icon: 'calendar', label: 'التقويم' },
  { name: 'More', comp: MoreStack, icon: 'grid', label: 'المزيد' },
];

function MainTabs() {
  const { theme } = useApp();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.faint,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 8,
          ...shadow(2),
        },
        tabBarLabelStyle: { fontFamily: F.s, fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const entry = TABS.find((t) => t.name === route.name);
          return <Ionicons name={(entry?.icon || 'ellipse') as never} size={size - 2} color={color} />;
        },
      })}
    >
      {TABS.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.comp} options={{ tabBarLabel: t.label }} />
      ))}
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { theme, hydrated, state, permission, ensurePermission } = useApp();

  // Ask for notification permission once the student lands in the app.
  useEffect(() => {
    if (!hydrated || !state.onboarded) return;
    if (permission === 'granted' || !state.settings.notifications) return;
    const t = setTimeout(() => {
      ensurePermission();
    }, 1800);
    return () => clearTimeout(t);
  }, [hydrated, state.onboarded, state.settings.notifications, permission, ensurePermission]);

  // Snooze support for incoming alarm notifications.
  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((res) => {
        try {
          if (res.actionIdentifier === 'snooze') {
            const data = res.notification.request.content.data as { alarmId?: string } | undefined;
            const alarm = state.alarms.find((a) => a.id === data?.alarmId);
            snoozeIncoming(data?.alarmId || '', alarm?.snoozeMinutes || 10);
          }
        } catch {
          // ignore — web has no scheduled notifications
        }
      });
    } catch {
      // notifications unsupported on this platform
    }
    return () => {
      try {
        sub?.remove();
      } catch {
        // noop
      }
    };
  }, [state.alarms]);

  const navTheme = {
    ...(theme.mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      primary: theme.primary,
      border: theme.border,
    },
    fonts: {
      regular: { fontFamily: F.r },
      medium: { fontFamily: F.m },
      bold: { fontFamily: F.b },
      heavy: { fontFamily: F.x },
    },
  } as ReturnType<typeof NavigationContainer.prototype.props['theme']>;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Grade" component={GradeScreen} />
        <Stack.Screen name="Branch" component={BranchScreen} />
        <Stack.Screen name="Routine" component={RoutineScreen} />
        <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="Today" component={TodayScreen} />
        <Stack.Screen name="Week" component={WeekScreen} />
        <Stack.Screen name="Subjects" component={SubjectsScreen} />
        <Stack.Screen name="SubjectDetail" component={SubjectDetailScreen} />
        <Stack.Screen name="Focus" component={FocusScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
        <Stack.Screen name="Goals" component={GoalsScreen} />
        <Stack.Screen name="Achievements" component={AchievementsScreen} />
        <Stack.Screen name="Alarms" component={AlarmsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    ...MaterialCommunityIcons.font,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#4A55E0' }} />;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
