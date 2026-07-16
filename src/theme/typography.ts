import { TextStyle } from 'react-native';

type TypeStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'lineHeight' | 'letterSpacing'>;

export const typography: Record<string, TypeStyle> = {
  largeTitle: { fontSize: 32, fontWeight: '800', lineHeight: 38, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  heading: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  body: { fontSize: 16, fontWeight: '500', lineHeight: 22 },
  bodyRegular: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  small: { fontSize: 12, fontWeight: '500', lineHeight: 16 },
};
