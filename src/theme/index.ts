import { useMemo } from 'react';
import { Platform, useColorScheme, ViewStyle } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';
import { radii, spacing } from './spacing';
import { typography } from './typography';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  isDark: boolean;
  shadow: (level?: 'sm' | 'md' | 'lg') => ViewStyle;
}

function makeShadow(color: string) {
  return (level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle => {
    const config = {
      sm: { offset: 2, opacity: 0.08, radius: 4, elevation: 2 },
      md: { offset: 6, opacity: 0.12, radius: 12, elevation: 5 },
      lg: { offset: 12, opacity: 0.16, radius: 24, elevation: 10 },
    }[level];

    return Platform.select<ViewStyle>({
      ios: {
        shadowColor: color,
        shadowOffset: { width: 0, height: config.offset },
        shadowOpacity: config.opacity,
        shadowRadius: config.radius,
      },
      android: { elevation: config.elevation },
      default: {},
    })!;
  };
}

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return useMemo(() => {
    const colors = isDark ? darkColors : lightColors;
    return {
      colors,
      spacing,
      radii,
      typography,
      isDark,
      shadow: makeShadow(colors.shadow),
    };
  }, [isDark]);
}
