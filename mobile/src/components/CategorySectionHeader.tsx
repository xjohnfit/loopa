import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface Props {
  title: string;
  color: string;
  count: number;
  groupLabel?: string | null;
}

export default function CategorySectionHeader({ title, color, count, groupLabel }: Props) {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      {groupLabel && (
        <Text
          style={[
            theme.typography.heading,
            {
              color: theme.colors.textPrimary,
              marginTop: theme.spacing.lg,
              marginBottom: theme.spacing.xs,
            },
          ]}
        >
          {groupLabel}
        </Text>
      )}
      <View style={[styles.row, { paddingVertical: theme.spacing.sm }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
          {title.toUpperCase()} · {count}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
