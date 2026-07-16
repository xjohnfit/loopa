import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiSlice, useGetTasksQuery, useDeleteTaskMutation } from '../api/apiSlice';
import { useAppDispatch } from '../app/hooks';
import { signOut } from '../features/auth/authSlice';
import { useTheme } from '../theme';
import { ActionCard, Card, EmptyState, Icon, IconButton, Screen } from '../components/ui';

export default function ManageTasksScreen({ navigation }: any) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { data: tasks, isFetching, refetch } = useGetTasksQuery();
  const [deleteTask] = useDeleteTaskMutation();

  const confirmDelete = (id: string, title: string) => {
    Alert.alert('Delete task?', `“${title}” will be removed from your routine.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTask(id) },
    ]);
  };

  const confirmLogOut = () => {
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          dispatch(apiSlice.util.resetApiState());
          dispatch(signOut());
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-left" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <Text
          style={[theme.typography.title, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}
        >
          Manage Tasks
        </Text>
        <Pressable onPress={confirmLogOut} hitSlop={8} style={styles.headerSpacer}>
          <Text style={[theme.typography.caption, { color: theme.colors.danger }]}>Log Out</Text>
        </Pressable>
      </View>

      <View style={styles.actionRow}>
        <ActionCard
          icon="tag"
          label="Add Category"
          color="#20C997"
          onPress={() => navigation.navigate('CategoryForm')}
        />
        <ActionCard
          icon="plus"
          label="Add Task"
          color={theme.colors.primary}
          onPress={() => navigation.navigate('TaskForm')}
        />
      </View>

      <FlatList
        data={tasks ?? []}
        keyExtractor={(item) => item.id}
        refreshing={isFetching}
        onRefresh={refetch}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="list"
            title="No tasks yet"
            subtitle="Use the cards above to add a category or your first task."
          />
        }
        renderItem={({ item }) => (
          <Card
            style={[
              styles.row,
              {
                padding: theme.spacing.lg,
                marginBottom: theme.spacing.sm,
                borderLeftWidth: 4,
                borderLeftColor: item.category_color ?? 'transparent',
              },
            ]}
          >
            <Pressable
              onPress={() => navigation.navigate('TaskForm', { task: item })}
              style={styles.rowPressable}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.title}`}
            >
              <View
                style={[
                  styles.timeBadge,
                  { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.sm },
                ]}
              >
                <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>
                  {item.time.slice(0, 5)}
                </Text>
              </View>
              <Text
                style={[theme.typography.body, { color: theme.colors.textPrimary, flex: 1 }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Icon name="chevron-right" size={18} color={theme.colors.textTertiary} />
            </Pressable>
            <IconButton
              name="trash"
              size={34}
              iconSize={17}
              color={theme.colors.danger}
              backgroundColor={theme.colors.dangerSoft}
              onPress={() => confirmDelete(item.id, item.title)}
              accessibilityLabel={`Delete ${item.title}`}
              style={{ marginLeft: theme.spacing.sm }}
            />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerSpacer: { minWidth: 40, alignItems: 'flex-end' },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 4 },
  listContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBadge: { paddingVertical: 4, paddingHorizontal: 8 },
});
