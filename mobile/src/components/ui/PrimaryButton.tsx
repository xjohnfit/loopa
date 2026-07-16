import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  style,
}: Props) {
  const theme = useTheme();
  const isInactive = disabled || loading;

  const backgroundColor =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
      ? theme.colors.dangerSoft
      : theme.colors.surfaceAlt;

  const textColor =
    variant === 'primary'
      ? theme.colors.onPrimary
      : variant === 'danger'
      ? theme.colors.danger
      : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          opacity: isInactive ? 0.5 : pressed ? 0.85 : 1,
          borderRadius: theme.radii.lg,
          paddingVertical: theme.spacing.lg,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[theme.typography.heading, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
