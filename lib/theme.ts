import { I18nManager, Platform, ViewStyle } from 'react-native';

/**
 * RTL-aware layout helpers. We compute direction at runtime so the app renders
 * correctly whether the host device is already forced RTL or not.
 */
export const isRTL = I18nManager.isRTL;
export const ROW: 'row' | 'row-reverse' = isRTL ? 'row' : 'row-reverse';
export const TXT_RIGHT: 'left' | 'right' = isRTL ? 'left' : 'right';
export const CHEVRON_BACK = isRTL ? 'chevron-forward' : 'chevron-back';
export const CHEVRON_NEXT = isRTL ? 'chevron-back' : 'chevron-forward';

export const F = {
  r: 'Cairo_400Regular',
  m: 'Cairo_500Medium',
  s: 'Cairo_600SemiBold',
  b: 'Cairo_700Bold',
  x: 'Cairo_800ExtraBold',
};

export const RADIUS = { sm: 12, md: 16, lg: 22, xl: 28, pill: 999 };
export const SPACING = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28 };

export const PALETTE = {
  primary: '#5B67F1',
  primaryDark: '#3A45C7',
  primarySoft: '#ECEEFF',
  teal: '#12B5A0',
  tealSoft: '#E0F7F3',
  amber: '#F5A524',
  amberSoft: '#FDF1DD',
  rose: '#F2557E',
  roseSoft: '#FDE8EE',
  purple: '#9B5CF6',
  purpleSoft: '#F2E9FE',
  sky: '#38B6FF',
  skySoft: '#E3F4FF',
  green: '#25C16F',
  greenSoft: '#E2F7EC',
  indigo: '#6366F1',
};

export interface Theme {
  mode: 'light' | 'dark';
  bg: string;
  bgAlt: string;
  card: string;
  cardStrong: string;
  text: string;
  subtext: string;
  faint: string;
  border: string;
  divider: string;
  primary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  tabBar: string;
  overlay: string;
}

export const lightTheme: Theme = {
  mode: 'light',
  bg: '#F4F6FC',
  bgAlt: '#EAEDF8',
  card: '#FFFFFF',
  cardStrong: '#FFFFFF',
  text: '#101528',
  subtext: '#5A6485',
  faint: '#98A1BD',
  border: '#E4E8F4',
  divider: '#EEF1F9',
  primary: PALETTE.primary,
  primarySoft: PALETTE.primarySoft,
  success: PALETTE.green,
  successSoft: PALETTE.greenSoft,
  warn: PALETTE.amber,
  warnSoft: PALETTE.amberSoft,
  danger: PALETTE.rose,
  dangerSoft: PALETTE.roseSoft,
  tabBar: '#FFFFFF',
  overlay: 'rgba(11,16,38,0.45)',
};

export const darkTheme: Theme = {
  mode: 'dark',
  bg: '#0B0F1D',
  bgAlt: '#111629',
  card: '#151B30',
  cardStrong: '#1B2240',
  text: '#ECF0FB',
  subtext: '#9BA6C7',
  faint: '#6B769A',
  border: '#222A47',
  divider: '#1D2440',
  primary: '#7C87FF',
  primarySoft: '#1E2547',
  success: '#2FD48A',
  successSoft: '#122C25',
  warn: '#F7B84B',
  warnSoft: '#2E2517',
  danger: '#FF6E92',
  dangerSoft: '#2E1826',
  tabBar: '#111629',
  overlay: 'rgba(3,6,16,0.6)',
};

export function shadow(level: 1 | 2 | 3 = 1): ViewStyle {
  const base: ViewStyle = {
    shadowColor: '#0A1030',
    shadowOpacity: 0.06 + level * 0.03,
    shadowRadius: 6 * level,
    shadowOffset: { width: 0, height: 3 * level },
    elevation: level * 2,
  };
  if (Platform.OS === 'web') {
    return { ...base, boxShadow: `0 ${3 * level}px ${10 * level}px rgba(10,16,48,${0.05 + level * 0.03})` } as ViewStyle;
  }
  return base;
}
