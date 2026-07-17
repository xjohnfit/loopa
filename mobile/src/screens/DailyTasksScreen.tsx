import React, { useMemo } from 'react';
import { Alert, SectionList, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSelectedDate } from '../features/ui/uiSlice';
import { useDeleteTaskMutation, useGetCategoriesQuery, useGetDayQuery, useToggleTaskCompletionMutation } from '../api/apiSlice';
import { addDays, fromISODate, toISODate } from '../utils/date';
import { groupTasksByRecurrenceAndCategory } from '../utils/taskGrouping';
import { useTheme } from '../theme';
import { Card, EmptyState, IconButton, ProgressRing, Screen } from '../components/ui';
import DateHeader from '../components/DateHeader';
import TaskItem from '../components/TaskItem';
import CategorySectionHeader from '../components/CategorySectionHeader';

export default function DailyTasksScreen({ navigation }: any) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const selectedDateISO = useAppSelector((s) => s.ui.selectedDateISO);
  const selectedDate = useMemo(() => fromISODate(selectedDateISO), [selectedDateISO]);

  const { data: tasks, isFetching, refetch } = useGetDayQuery(selectedDateISO);
  const { data: categories } = useGetCategoriesQuery();
  const [toggle] = useToggleTaskCompletionMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const sections = useMemo(
    () => groupTasksByRecurrenceAndCategory(tasks ?? [], categories),
    [tasks, categories]
  );

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete task?', `“${title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  const goToDate = (d: Date) => dispatch(setSelectedDate(toISODate(d)));
  const changeDay = (amount: number) => goToDate(addDays(selectedDate, amount));

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.completed).length ?? 0;
  const progress = total > 0 ? done / total : 0;

  return (
    <Screen>
      <View style={styles.topBar}>
        <Text style={[theme.typography.title, { color: theme.colors.primary }]}>Loopa</Text>
        <IconButton
          name="list"
          onPress={() => navigation.navigate('ManageTasks')}
          accessibilityLabel="Manage tasks"
        />
      </View>

      <DateHeader
        selectedDate={selectedDate}
        onPrev={() => changeDay(-1)}
        onNext={() => changeDay(1)}
        onSelectDate={goToDate}
        onToday={() => goToDate(new Date())}
      />

      {total > 0 && (
        <Card style={[styles.progressCard, { padding: theme.spacing.lg, marginHorizontal: theme.spacing.lg }]}>
          <ProgressRing progress={progress} color={theme.colors.primary} trackColor={theme.colors.surfaceAlt}>
            <Text style={[theme.typography.caption, { color: theme.colors.textPrimary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </ProgressRing>
          <View style={styles.progressTextWrap}>
            <Text style={[theme.typography.heading, { color: theme.colors.textPrimary }]}>
              {done} of {total} done
            </Text>
            <Text style={[theme.typography.bodyRegular, { color: theme.colors.textSecondary }]}>
              {done === total ? 'Nice work — day complete!' : 'Keep going, you’ve got this.'}
            </Text>
          </View>
        </Card>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-check"
            title="Nothing scheduled"
            subtitle="Add a task from Manage Tasks to start building your daily routine."
          />
        }
        renderSectionHeader={({ section }) => (
          <CategorySectionHeader
            title={section.title}
            color={section.color}
            count={section.data.length}
            groupLabel={section.groupLabel}
          />
        )}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={() =>
              toggle({ date: selectedDateISO, taskId: item.id, completed: !item.completed })
            }
            onDelete={() => confirmDelete(item.id, item.title)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  progressTextWrap: { flex: 1 },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
});
