import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import Icon from './Icon';

interface Props {
  onPress: () => void;
  accessibilityLabel: string;
}

export default function Fab({ onPress, accessibilityLabel }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.colors.primary,
          bottom: theme.spacing.xxl,
          right: theme.spacing.xxl,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        theme.shadow('lg'),
      ]}
    >
      <Icon name="plus" size={26} color={theme.colors.onPrimary} strokeWidth={2.25} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
