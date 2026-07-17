import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { IconButton } from './ui';
import { formatMonthYear, getMonthMatrix, isSameDay, isSameMonth } from '../utils/date';

interface Props {
  month: Date;
  selectedDate: Date;
  today: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthCalendar({ month, selectedDate, today, onSelectDate, onPrevMonth, onNextMonth }: Props) {
  const theme = useTheme();
  const weeks = getMonthMatrix(month);

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <IconButton
          name="chevron-left"
          size={34}
          iconSize={16}
          onPress={onPrevMonth}
          accessibilityLabel="Previous month"
        />
        <Text style={[theme.typography.heading, { color: theme.colors.textPrimary }]}>{formatMonthYear(month)}</Text>
        <IconButton
          name="chevron-right"
          size={34}
          iconSize={16}
          onPress={onNextMonth}
          accessibilityLabel="Next month"
        />
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LETTERS.map((letter, i) => (
          <Text key={i} style={[theme.typography.small, styles.weekdayLabel, { color: theme.colors.textTertiary }]}>
            {letter}
          </Text>
        ))}
      </View>

      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day) => {
            const inMonth = isSameMonth(day, month);
            const selected = isSameDay(day, selectedDate);
            const dayIsToday = isSameDay(day, today);
            return (
              <Pressable
                key={day.toISOString()}
                onPress={() => onSelectDate(day)}
                disabled={!inMonth}
                style={styles.dayCell}
                accessibilityRole="button"
                accessibilityLabel={day.toDateString()}
              >
                <View
                  style={[
                    styles.dayPill,
                    { borderRadius: theme.radii.full },
                    selected && { backgroundColor: theme.colors.primary },
                    !selected && dayIsToday && inMonth && { borderWidth: 1.5, borderColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: !inMonth
                          ? theme.colors.textTertiary
                          : selected
                          ? theme.colors.onPrimary
                          : dayIsToday
                          ? theme.colors.primary
                          : theme.colors.textPrimary,
                        opacity: inMonth ? 1 : 0.35,
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
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  weekdayLabel: { width: 40, textAlign: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 4 },
  dayCell: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40 },
  dayPill: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
