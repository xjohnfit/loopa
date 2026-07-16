import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { IconButton } from './ui';
import { addDays, formatMonthDay, formatWeekday, isSameDay, startOfWeek } from '../utils/date';

interface Props {
  selectedDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: Date) => void;
  onToday: () => void;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DateHeader({ selectedDate, onPrev, onNext, onSelectDate, onToday }: Props) {
  const theme = useTheme();
  const today = useMemo(() => new Date(), []);
  const isToday = isSameDay(selectedDate, today);

  const week = useMemo(() => {
    const start = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <IconButton name="chevron-left" onPress={onPrev} accessibilityLabel="Previous day" />
        <View style={styles.titleTextWrap}>
          <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {isToday ? 'Today' : formatWeekday(selectedDate)}
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
            {formatMonthDay(selectedDate)}
          </Text>
        </View>
        <IconButton name="chevron-right" onPress={onNext} accessibilityLabel="Next day" />
      </View>

      <View style={styles.weekRow}>
        {week.map((day, i) => {
          const selected = isSameDay(day, selectedDate);
          const dayIsToday = isSameDay(day, today);
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelectDate(day)}
              accessibilityRole="button"
              accessibilityLabel={day.toDateString()}
              style={styles.dayCell}
            >
              <Text
                style={[
                  theme.typography.small,
                  { color: selected ? theme.colors.primary : theme.colors.textTertiary, marginBottom: 6 },
                ]}
              >
                {WEEKDAY_LETTERS[i]}
              </Text>
              <View
                style={[
                  styles.dayPill,
                  { borderRadius: theme.radii.full },
                  selected && { backgroundColor: theme.colors.primary },
                  !selected && dayIsToday && { borderWidth: 1.5, borderColor: theme.colors.primary },
                ]}
              >
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: selected
                        ? theme.colors.onPrimary
                        : dayIsToday
                        ? theme.colors.primary
                        : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {!isToday && (
        <Pressable onPress={onToday} style={styles.todayLink} accessibilityRole="button">
          <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>Jump to today</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleTextWrap: { alignItems: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  dayCell: { alignItems: 'center', width: 40 },
  dayPill: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  todayLink: { alignSelf: 'center', marginTop: 10, padding: 4 },
});
