export const palette = {
  violet: '#6D5DF6',
  violetLight: '#8B7DFB',
  indigo: '#4338CA',
  navy: '#0F1024',
  white: '#FFFFFF',
  red: '#EF4444',
  redLight: '#F87171',
  amber: '#F5A524',
};

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  overlay: string;
  primary: string;
  primaryPressed: string;
  primarySoft: string;
  onPrimary: string;
  danger: string;
  dangerSoft: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnPrimary: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: '#F7F7FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F8',
  border: '#EAEAF3',
  overlay: 'rgba(15, 16, 36, 0.5)',

  primary: palette.violet,
  primaryPressed: palette.indigo,
  primarySoft: '#EEECFF',
  onPrimary: palette.white,

  danger: palette.red,
  dangerSoft: '#FDECEC',

  textPrimary: '#14162B',
  textSecondary: '#6B6E85',
  textTertiary: '#9C9EB3',
  textOnPrimary: palette.white,

  shadow: '#2A2360',
};

export const darkColors: ThemeColors = {
  background: '#0B0C1E',
  surface: '#181A34',
  surfaceAlt: '#20223F',
  border: '#2B2D4E',
  overlay: 'rgba(0, 0, 0, 0.6)',

  primary: palette.violetLight,
  primaryPressed: palette.violet,
  primarySoft: '#2A2760',
  onPrimary: palette.navy,

  danger: palette.redLight,
  dangerSoft: '#3A1E28',

  textPrimary: '#F5F5FB',
  textSecondary: '#A6A8C6',
  textTertiary: '#71749A',
  textOnPrimary: palette.navy,

  shadow: '#000000',
};
