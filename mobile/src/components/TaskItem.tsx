import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DayTask } from '../api/apiSlice';
import { useTheme } from '../theme';
import { Icon } from './ui';

interface Props {
  task: DayTask;
  onToggle: () => void;
}

export default function TaskItem({ task, onToggle }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: theme.colors.border,
          borderLeftWidth: 4,
          borderLeftColor: task.category_color ?? 'transparent',
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.sm,
        },
        !theme.isDark && theme.shadow('sm'),
      ]}
    >
      <Pressable
        onPress={onToggle}
        hitSlop={10}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        style={[
          styles.checkbox,
          {
            borderRadius: theme.radii.full,
            borderColor: task.completed ? theme.colors.primary : theme.colors.border,
            backgroundColor: task.completed ? theme.colors.primary : 'transparent',
          },
        ]}
      >
        {task.completed && <Icon name="check" size={15} color={theme.colors.onPrimary} strokeWidth={3} />}
      </Pressable>

      <View style={styles.textWrap}>
        <Text
          style={[
            theme.typography.body,
            {
              color: task.completed ? theme.colors.textTertiary : theme.colors.textPrimary,
              textDecorationLine: task.completed ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={2}
        >
          {task.title}
        </Text>
        {task.category_name && (
          <Text style={[theme.typography.small, { color: theme.colors.textTertiary, marginTop: 2 }]}>
            {task.category_name}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.timeBadge,
          { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.sm },
        ]}
      >
        <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>
          {task.time.slice(0, 5)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: {
    width: 26,
    height: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  timeBadge: { paddingVertical: 4, paddingHorizontal: 8 },
});
