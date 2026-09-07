import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, EmptyState, IconButton, Input, PrimaryButton, SectionTitle, Sheet, SoftButton, Stepper, ToggleRow, Txt } from '../components/ui';
import { TimeEditor } from '../components/TimePicker';
import { useApp } from '../lib/store';
import { notifyNow } from '../lib/notifications';
import { AR_DAYS_SHORT, formatTime } from '../lib/format';
import { SOUND_OPTIONS } from '../lib/presets';
import { PALETTE, ROW, SPACING } from '../lib/theme';
import { Alarm } from '../lib/types';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Alarms'>;

const KIND_META: Record<Alarm['kind'], { icon: string; color: string; label: string }> = {
  wake: { icon: 'sunny', color: PALETTE.amber, label: 'الاستيقاظ' },
  study: { icon: 'book', color: PALETTE.primary, label: 'المذاكرة' },
  session: { icon: 'timer', color: PALETTE.teal, label: 'جلسة مذاكرة' },
  exercise: { icon: 'fitness', color: PALETTE.rose, label: 'التمارين' },
  review: { icon: 'bulb', color: PALETTE.purple, label: 'المراجعة' },
  sleep: { icon: 'bed', color: '#6366F1', label: 'النوم' },
  custom: { icon: 'alarm', color: PALETTE.sky, label: 'مخصص' },
};

const blankAlarm = (): Omit<Alarm, 'id'> => ({
  title: 'منبه جديد',
  body: 'حان وقتك المخصص — لا تنسَ موعدك!',
  time: 8 * 60,
  days: [0, 1, 2, 3, 4],
  enabled: true,
  sound: 'classic',
  vibrate: true,
  kind: 'custom',
  snoozeMinutes: 10,
});

export default function AlarmsScreen({ navigation }: Props) {
  const { theme, state, permission, ensurePermission, addAlarm, updateAlarm, deleteAlarm, updateSettings, syncNotifications, haptic } = useApp();
  const [edit, setEdit] = useState<Alarm | null>(null);
  const [draft, setDraft] = useState<Omit<Alarm, 'id'>>(blankAlarm());
  const [adding, setAdding] = useState(false);

  const openEdit = (a: Alarm) => {
    setEdit(a);
    setDraft({ ...a });
    setAdding(false);
  };

  const openAdd = () => {
    setEdit(null);
    setDraft(blankAlarm());
    setAdding(true);
  };

  const save = () => {
    if (adding) addAlarm(draft);
    else if (edit) updateAlarm(edit.id, draft);
    setEdit(null);
    setAdding(false);
    setTimeout(() => syncNotifications(), 200);
  };

  const grouped = (['wake', 'study', 'session', 'exercise', 'review', 'sleep', 'custom'] as Alarm['kind'][]).map((k) => ({
    kind: k,
    items: state.alarms.filter((a) => a.kind === k),
  })).filter((g) => g.items.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader
        title="المنبهات والإشعارات"
        subtitle={`${state.alarms.filter((a) => a.enabled).length} منبه مفعّل من ${state.alarms.length}`}
        onBack={() => navigation.goBack()}
        right={<IconButton icon="add" onPress={openAdd} />}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {permission !== 'granted' ? (
          <Card level={2} style={{ borderColor: theme.warn, borderWidth: 1.4 }}>
            <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: theme.warnSoft, alignItems: 'center', justifyContent: 'center' }}>
                <SIcon name="notifications-off" size={22} color={theme.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt size={14} weight="b">
                  الإشعارات غير مفعّلة
                </Txt>
                <Txt size={12} color={theme.subtext} style={{ marginTop: 3, lineHeight: 19 }}>
                  فعّلها ليصلك تنبيه بكل موعد حتى بعد إغلاق التطبيق.
                </Txt>
              </View>
            </View>
            <PrimaryButton label="تفعيل الإشعارات الآن" icon="notifications" style={{ marginTop: 14 }} onPress={() => ensurePermission()} />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 6 }}>
            <ToggleRow
              icon="notifications"
              title="تفعيل كل التنبيهات"
              desc="إيقافه يلغي جميع المنبهات المجدولة"
              value={state.settings.notifications}
              onChange={(v) => {
                updateSettings({ notifications: v });
                setTimeout(() => syncNotifications(), 300);
              }}
            />
          </Card>
        )}

        <View style={{ flexDirection: ROW, gap: 10, marginTop: 12 }}>
          <SoftButton
            label="إعادة جدولة المنبهات"
            icon="refresh"
            tone="primary"
            small
            style={{ flex: 1 }}
            onPress={async () => {
              const n = await syncNotifications();
              notifyNow('تمت الجدولة ✅', `${n} تنبيه مجدول الآن حسب جدولك.`);
            }}
          />
          <SoftButton label="تجربة تنبيه" icon="flash" tone="muted" small style={{ flex: 1 }} onPress={() => notifyNow('تجربة منبه ⏰', 'هكذا سيصلك التنبيه في وقته!')} />
        </View>

        {grouped.map((g) => (
          <View key={g.kind}>
            <SectionTitle title={KIND_META[g.kind].label} icon={KIND_META[g.kind].icon} color={KIND_META[g.kind].color} />
            <View style={{ gap: 10 }}>
              {g.items.map((a) => (
                <Card key={a.id} style={{ paddingVertical: 12, opacity: a.enabled ? 1 : 0.6 }}>
                  <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
                    <Pressable onPress={() => openEdit(a)} style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: `${KIND_META[a.kind].color}1F`, alignItems: 'center', justifyContent: 'center' }}>
                      <SIcon name={KIND_META[a.kind].icon} size={22} color={KIND_META[a.kind].color} />
                    </Pressable>
                    <Pressable style={{ flex: 1 }} onPress={() => openEdit(a)}>
                      <Txt size={14} weight="b" numberOfLines={1}>
                        {a.title}
                      </Txt>
                      <Txt size={12} color={theme.subtext} style={{ marginTop: 2 }}>
                        {formatTime(a.time)} • {a.days.length === 7 ? 'يومياً' : a.days.map((d) => AR_DAYS_SHORT[d]).join('، ') || '—'}
                      </Txt>
                      <Txt size={11} color={theme.faint} style={{ marginTop: 2 }}>
                        {SOUND_OPTIONS.find((s) => s.id === (a.sound || state.settings.sound))?.label || 'منبه كلاسيكي'} • تأجيل {a.snoozeMinutes} د{a.vibrate ? ' • اهتزاز' : ''}
                      </Txt>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        haptic('light');
                        updateAlarm(a.id, { enabled: !a.enabled });
                        setTimeout(() => syncNotifications(), 250);
                      }}
                      style={{
                        width: 50,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: a.enabled ? theme.success : theme.mode === 'dark' ? '#2A3252' : '#E3E7F2',
                        padding: 3,
                        justifyContent: 'center',
                        alignItems: a.enabled ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }} />
                    </Pressable>
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ))}

        {state.alarms.length === 0 ? (
          <EmptyState icon="alarm" title="لا توجد منبهات" desc="أنشئ منبهاتك الخاصة أو أعد ضبط الجدول من الإعدادات." actionLabel="إضافة منبه" onAction={openAdd} />
        ) : null}

        <Txt size={11.5} color={theme.faint} align="center" style={{ marginTop: 20, lineHeight: 19 }}>
          تعمل المنبهات عبر الإشعارات المحلية المجدولة، وتستمر حتى بعد إغلاق التطبيق على أندرويد وiOS.
        </Txt>
      </ScrollView>

      <Sheet visible={adding || !!edit} onClose={() => { setAdding(false); setEdit(null); }} title={adding ? 'منبه جديد' : 'تعديل المنبه'}>
        <SectionTitle title="العنوان" icon="pencil" />
        <Input value={draft.title} onChangeText={(t) => setDraft((d) => ({ ...d, title: t }))} placeholder="مثال: حان وقت الفيزياء" returnKeyType="done" />
        <SectionTitle title="نص التنبيه" icon="chatbubble-ellipses" />
        <Input value={draft.body} onChangeText={(t) => setDraft((d) => ({ ...d, body: t }))} placeholder="نص يظهر داخل الإشعار" multiline />
        <SectionTitle title="الوقت" icon="time" />
        <TimeEditor value={draft.time} onChange={(v) => setDraft((d) => ({ ...d, time: v }))} />
        <SectionTitle title="الأيام" icon="calendar" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
          {AR_DAYS_SHORT.map((d, i) => {
            const active = draft.days.includes(i);
            return (
              <Pressable
                key={d}
                onPress={() => setDraft((x) => ({ ...x, days: active ? x.days.filter((y) => y !== i) : [...x.days, i].sort() }))}
                style={{ paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, backgroundColor: active ? theme.primary : theme.card, borderWidth: 1, borderColor: active ? theme.primary : theme.border }}
              >
                <Txt size={12.5} weight="s" color={active ? '#fff' : theme.subtext}>
                  {d}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <SectionTitle title="صوت المنبه" icon="musical-notes" />
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap' }}>
          {SOUND_OPTIONS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setDraft((d) => ({ ...d, sound: s.id }))}
              style={{ flexDirection: ROW, alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 999, backgroundColor: draft.sound === s.id ? PALETTE.teal : theme.card, borderWidth: 1, borderColor: draft.sound === s.id ? PALETTE.teal : theme.border }}
            >
              <SIcon name="volume-high" size={14} color={draft.sound === s.id ? '#fff' : theme.subtext} />
              <Txt size={12.5} weight="s" color={draft.sound === s.id ? '#fff' : theme.subtext}>
                {s.label}
              </Txt>
            </Pressable>
          ))}
        </View>
        <SectionTitle title="مدة التأجيل" icon="hourglass" />
        <Card style={{ marginBottom: 8 }}>
          <Stepper value={draft.snoozeMinutes} onChange={(v) => setDraft((d) => ({ ...d, snoozeMinutes: v }))} step={5} min={0} max={30} format={(v) => (v === 0 ? 'بدون تأجيل' : `${v} دقائق`)} />
        </Card>
        <Card style={{ paddingVertical: 6 }}>
          <ToggleRow icon="phone-portrait" title="اهتزاز الجهاز" desc="يهتز الهاتف مع المنبه" value={draft.vibrate} onChange={(v) => setDraft((d) => ({ ...d, vibrate: v }))} />
          <ToggleRow icon="power" title="المنبه مفعّل" value={draft.enabled} onChange={(v) => setDraft((d) => ({ ...d, enabled: v }))} />
        </Card>
        <View style={{ flexDirection: ROW, gap: 10, marginTop: 18 }}>
          {!adding && edit ? (
            <SoftButton
              label="حذف"
              icon="trash"
              tone="danger"
              style={{ flex: 1 }}
              onPress={() => {
                deleteAlarm(edit.id);
                setEdit(null);
                setTimeout(() => syncNotifications(), 250);
              }}
            />
          ) : null}
          <PrimaryButton label="حفظ" icon="checkmark" style={{ flex: 1 }} onPress={save} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}
