import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export default function Card({ children, style, elevated = true }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.colors.border,
        },
        elevated && !theme.isDark && theme.shadow('sm'),
        style,
      ]}
    >
      {children}
    </View>
  );
}
