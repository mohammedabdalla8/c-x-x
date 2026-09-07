export interface Quote {
  text: string;
  author: string;
}

export const QUOTES: Quote[] = [
  { text: 'الاستمرارية تهزم الموهبة حين لا تجد الموهبة استمرارية.', author: 'مثل عربي' },
  { text: 'مَن جدّ وجد، ومَن زرع حصد.', author: 'مثل عربي' },
  { text: 'رحلتك تبدأ بخطوة صغيرة كل يوم.', author: 'okusun' },
  { text: 'لا تنتظر اللحظة المثالية، اجعل لحظتك مثالية.', author: 'مثل مشهور' },
  { text: 'التاريخ يصنعه الملتزمون لا الموهوبون.', author: 'حكماء' },
  { text: 'كل دقيقة تركيز اليوم قيمة غالية في يوم الامتحان.', author: 'منظم الطالب' },
  { text: 'الصبر مفتاح الفرج، والجدّ مفتاح النجاح.', author: 'مثل عربي' },
  { text: 'ثقتك بنفسك تكبر مع كل جلسة أنجزتها.', author: 'منظم الطالب' },
  { text: 'الним يجدد الجسم، والنظام يجدد العقل.', author: 'منظم الطالب' },
  { text: 'أول درس اليوم أهم من عشر دروس غداً.', author: 'منظم الطالب' },
  { text: 'الالتزام صغير كل يوم، كبير بعد سنة.', author: 'مثل عربي' },
  { text: 'اجعل عاداتك أقوى من أهوائك.', author: 'حكماء' },
];

export function quoteOfDay(seed: string): Quote {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return QUOTES[h % QUOTES.length];
}

export const LEVEL_TITLES = [
  'مبتدئ', 'منظّم', 'منظّم ماهر', 'طالب مجتهد', 'خبير التركيز',
  '学霸', 'بطل المذاكرة', 'أسطورة الالتزام', 'عبقري الثانوية', 'نجم المنظمة',
];

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.max(0, level - 1))];
}
