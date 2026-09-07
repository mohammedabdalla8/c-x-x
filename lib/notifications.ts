import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm } from './types';

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // web / unsupported environments — in-app reminders still work
}

export const notificationsSupported = Platform.OS === 'android' || Platform.OS === 'ios';

let channelReady = false;
async function ensureChannel(): Promise<void> {
  if (channelReady || Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('alarms', {
      name: 'منبهات ومذاكرة',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lightColor: '#5B67F1',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
    });
    channelReady = true;
  } catch {
    channelReady = false;
  }
}

export async function getPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const res = await Notifications.getPermissionsAsync();
    return res.status as 'granted' | 'denied' | 'undetermined';
  } catch {
    return 'undetermined';
  }
}

export async function requestPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const res = await Notifications.requestPermissionsAsync();
    return res.status === 'granted';
  } catch {
    return false;
  }
}

export async function cancelAllScheduled(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore — not supported on this platform
  }
}

function triggerFor(alarm: Alarm, day: number): Notifications.DailyTriggerInput | Notifications.WeeklyTriggerInput | null {
  const hour = Math.floor(alarm.time / 60) % 24;
  const minute = alarm.time % 60;
  if (alarm.days.length === 7) {
    return { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: day + 1,
    hour,
    minute,
  };
}

/** Replaces every scheduled notification with the current alarm set (idempotent). */
export async function syncAlarms(alarms: Alarm[], sound: string): Promise<number> {
  if (!notificationsSupported) return 0;
  await ensureChannel();
  await cancelAllScheduled();
  let count = 0;
  for (const alarm of alarms) {
    if (!alarm.enabled) continue;
    const days = alarm.days.length ? alarm.days : [0, 1, 2, 3, 4, 5, 6];
    for (const day of days) {
      const trigger = triggerFor(alarm, day);
      if (!trigger) continue;
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: alarm.title,
            body: alarm.body,
            sound: true,
            vibrate: alarm.vibrate ? [0, 500, 250, 500] : undefined,
            data: { kind: 'alarm', alarmId: alarm.id, sound: sound || alarm.sound },
            ...(Platform.OS === 'android' ? { channelId: 'alarms' } : {}),
            ...(alarm.snoozeMinutes > 0
              ? { actions: [{ identifier: 'snooze', title: `تأجيل ${alarm.snoozeMinutes} دقائق` }] }
              : {}),
          },
          trigger,
        });
        count += 1;
      } catch {
        // unsupported trigger on this platform — keep going
      }
    }
  }
  return count;
}

export async function notifyNow(title: string, body: string, sound = true): Promise<void> {
  try {
    if (Platform.OS === 'android') await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound,
        ...(Platform.OS === 'android' ? { channelId: 'alarms' } : {}),
      },
      trigger: null,
    });
  } catch {
    // silent
  }
}

export async function snoozeIncoming(alarmId: string, minutes: number): Promise<void> {
  try {
    if (Platform.OS === 'android') await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'تذكير مؤجَّل ⏰',
        body: 'انتهى وقت التأجيل — عد لنشاطك المهم!',
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'alarms' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, minutes) * 60,
      },
    });
  } catch {
    // silent
  }
}

export async function countScheduled(): Promise<number> {
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).length;
  } catch {
    return 0;
  }
}
