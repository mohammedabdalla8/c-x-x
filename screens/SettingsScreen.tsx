import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { SIcon } from '../components/SIcon';
import { AppHeader, Card, Input, PrimaryButton, SectionTitle, Segmented, Sheet, SoftButton, ToggleRow, Txt } from '../components/ui';
import { TimeField } from '../components/TimePicker';
import { useApp } from '../lib/store';
import { formatDuration, formatTime } from '../lib/format';
import { SOUND_OPTIONS } from '../lib/presets';
import { PALETTE, ROW, RADIUS, SPACING } from '../lib/theme';
import { RootStackParamList } from '../lib/nav';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { theme, state, updateSettings, updateRoutine, ensurePermission, permission, syncNotifications, exportData, importData, resetAll } = useApp();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [copied, setCopied] = useState(false);

  const backup = async () => {
    try {
      await Clipboard.setStringAsync(exportData());
      updateSettings({ lastBackupAt: Date.now() });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      Alert.alert('تعذّر النسخ', 'انسخ البيانات يدوياً من الإعدادات المتقدمة.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <AppHeader title="الإعدادات" subtitle="تحكّم كامل بتجربتك" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SectionTitle title="المظهر" icon="color-palette" />
        <Card>
          <Segmented
            options={[
              { label: 'النظام', value: 'system' },
              { label: 'فاتح', value: 'light' },
              { label: 'داكن', value: 'dark' },
            ]}
            value={state.settings.theme}
            onChange={(v) => updateSettings({ theme: v as 'system' | 'light' | 'dark' })}
          />
        </Card>

        <SectionTitle title="الإشعارات والصوت" icon="notifications" color={PALETTE.amber} />
        <Card style={{ paddingVertical: 6 }}>
          <ToggleRow
            icon="alarm"
            title="التنبيهات والتذكيرات"
            desc="منبهات الاستيقاظ والمذاكرة والتمارين والنوم"
            value={state.settings.notifications}
            onChange={(v) => {
              updateSettings({ notifications: v });
              setTimeout(() => syncNotifications(), 300);
            }}
          />
          <ToggleRow icon="phone-portrait" title="الاهتزاز" desc="اهتزاز خفيف عند التفاعل داخل التطبيق" value={state.settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        </Card>
        <View style={{ flexDirection: ROW, gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {SOUND_OPTIONS.map((s) => (
            <SoftButton
              key={s.id}
              label={s.label}
              icon={state.settings.sound === s.id ? 'volume-high' : 'volume-medium-outline'}
              tone={state.settings.sound === s.id ? 'primary' : 'muted'}
              small
              onPress={() => {
                updateSettings({ sound: s.id });
                setTimeout(() => syncNotifications(), 300);
              }}
            />
          ))}
        </View>
        {permission !== 'granted' ? (
          <View style={{ marginTop: 12 }}>
            <PrimaryButton label="منح إذن الإشعارات" icon="notifications" onPress={() => ensurePermission()} />
          </View>
        ) : null}

        <SectionTitle title="الروتين اليومي" icon="time" color={PALETTE.teal} />
        <Card>
          <RowLine icon="sunny" label="الاستيقاظ" value={formatTime(state.routine.wakeUp)} />
          <RowLine icon="book" label="بداية المذاكرة" value={formatTime(state.routine.studyStart)} />
          <RowLine icon="hourglass" label="ساعات المذاكرة" value={`${state.routine.studyHours} ساعات`} />
          <RowLine icon="fitness" label="التمارين" value={`${formatTime(state.routine.exerciseTime)} • ${formatDuration(state.routine.exerciseDuration)}`} />
          <RowLine icon="moon" label="النوم" value={formatTime(state.routine.sleep)} />
          <View style={{ marginTop: 14 }}>
            <PrimaryButton label="تعديل الجدول الذكي" icon="create" onPress={() => navigation.navigate('Routine')} />
          </View>
        </Card>

        <SectionTitle title="البيانات والنسخ الاحتياطي" icon="cloud-download" color={PALETTE.purple} />
        <Card>
          <View style={{ flexDirection: ROW, gap: 12, alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 15, backgroundColor: PALETTE.purpleSoft, alignItems: 'center', justifyContent: 'center' }}>
              <SIcon name={copied ? 'checkmark' : 'save'} size={21} color={PALETTE.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={14} weight="b">
                {copied ? 'تم نسخ نسختك الاحتياطية ✓' : 'نسخة احتياطية'}
              </Txt>
              <Txt size={11.5} color={theme.subtext} style={{ marginTop: 2 }}>
                {state.settings.lastBackupAt ? `آخر نسخة: ${new Date(state.settings.lastBackupAt).toLocaleString('ar-EG')}` : 'احفظ بياناتك لاستعادتها لاحقاً أو نقلها لجهاز آخر'}
              </Txt>
            </View>
          </View>
          <View style={{ flexDirection: ROW, gap: 10, marginTop: 14 }}>
            <SoftButton label={copied ? 'تم النسخ' : 'نسخ النسخة'} icon="copy" tone="primary" small style={{ flex: 1 }} onPress={backup} />
            <SoftButton label="استعادة" icon="refresh" tone="muted" small style={{ flex: 1 }} onPress={() => setRestoreOpen(true)} />
          </View>
          <View style={{ height: 1, backgroundColor: theme.divider, marginVertical: 14 }} />
          <SoftButton
            label="تصفير كل البيانات"
            icon="trash"
            tone="danger"
            onPress={() =>
              Alert.alert('تصفير البيانات؟', 'سيتم حذف جدولك وموادك ودروسك وإنجازاتك نهائياً. هل أنت متأكد؟', [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'حذف الكل', style: 'destructive', onPress: () => resetAll() },
              ])
            }
          />
        </Card>

        <SectionTitle title="حول التطبيق" icon="information-circle" />
        <Card>
          <RowLine icon="school" label="الإصدار" value="1.0.0" />
          <RowLine icon="cloud-off" label="بدون إنترنت" value="يعمل بالكامل محلياً ✓" />
          <RowLine icon="alarm" label="منبهات مجدولة" value={`${state.alarms.filter((a) => a.enabled).length} مفعّلة`} />
          <Txt size={11.5} color={theme.faint} style={{ marginTop: 12, lineHeight: 20 }}>
            جميع بياناتك محفوظة على جهازك أولاً، وتُزامَن عند توفر النسخ الاحتياطي. لا نشارك أي بيانات مع طرف ثالث.
          </Txt>
        </Card>
      </ScrollView>

      <Sheet visible={restoreOpen} onClose={() => setRestoreOpen(false)} title="استعادة نسخة احتياطية">
        <Txt size={12.5} color={theme.subtext} style={{ marginBottom: 12 }}>
          الصق النص الذي نسخته من نسختك الاحتياطية سابقاً ثم اضغط استعادة.
        </Txt>
        <Input value={restoreJson} onChangeText={setRestoreJson} placeholder='{"version":1, ...}' multiline style={{ minHeight: 140, textAlignVertical: 'top', fontSize: 12 }} />
        <PrimaryButton
          label="استعادة البيانات"
          icon="cloud-upload"
          style={{ marginTop: 16 }}
          onPress={() => {
            const ok = importData(restoreJson);
            Alert.alert(ok ? 'تمت الاستعادة ✓' : 'فشل الاستعادة', ok ? 'تم تحميل بياناتك بنجاح.' : 'تأكد من نسخ النص كاملاً بدون تعديل.');
            if (ok) setRestoreOpen(false);
          }}
        />
      </Sheet>
    </SafeAreaView>
  );
}

function RowLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  const { theme } = useApp();
  return (
    <View style={{ flexDirection: ROW, alignItems: 'center', gap: 12, paddingVertical: 9 }}>
      <SIcon name={icon} size={18} color={theme.primary} />
      <Txt size={13.5} weight="m" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt size={13} weight="b" color={theme.subtext}>
        {value}
      </Txt>
    </View>
  );
}
