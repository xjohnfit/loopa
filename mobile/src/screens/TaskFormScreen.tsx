import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Recurrence, useCreateTaskMutation, useGetCategoriesQuery, useUpdateTaskMutation } from '../api/apiSlice';
import { useTheme } from '../theme';
import { toISODate } from '../utils/date';
import { Card, Icon, IconButton, PrimaryButton, Screen } from '../components/ui';

export default function TaskFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const existing = route.params?.task;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [time, setTime] = useState<Date>(
    existing ? new Date(`1970-01-01T${existing.time}`) : new Date()
  );
  const [categoryId, setCategoryId] = useState<string | null>(existing?.category_id ?? null);
  const [recurrence, setRecurrence] = useState<Recurrence>(existing?.recurrence ?? 'recurring');

  const { data: categories } = useGetCategoriesQuery();
  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const saving = isCreating || isUpdating;

  const handleSave = async () => {
    const timeStr = time.toTimeString().slice(0, 8); // HH:MM:SS
    // Preserve the original scheduled_date if we're editing an existing
    // one-off task; only default to today for a freshly-created one.
    const scheduledDate = recurrence === 'once' ? existing?.scheduled_date ?? toISODate(new Date()) : null;

    if (existing) {
      await updateTask({ id: existing.id, title, time: timeStr, category_id: categoryId, recurrence, scheduled_date: scheduledDate });
    } else {
      await createTask({ title, time: timeStr, category_id: categoryId, recurrence, scheduled_date: scheduledDate });
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
        >
          <View style={styles.header}>
            <IconButton name="chevron-left" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
            <Text
              style={[theme.typography.title, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}
            >
              {existing ? 'Edit Task' : 'New Task'}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + theme.spacing.xl }]}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={{ padding: theme.spacing.lg }}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm },
                ]}
              >
                TASK NAME
              </Text>
              <TextInput
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surfaceAlt,
                    borderRadius: theme.radii.md,
                    padding: theme.spacing.md,
                  },
                ]}
                placeholder="e.g. Morning run"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                autoFocus={!existing}
              />

              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
                ]}
              >
                WHEN
              </Text>
              <View style={[styles.segmented, { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.full }]}>
                <Pressable
                  onPress={() => setRecurrence('recurring')}
                  style={[
                    styles.segment,
                    { borderRadius: theme.radii.full },
                    recurrence === 'recurring' && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.body,
                      { color: recurrence === 'recurring' ? theme.colors.onPrimary : theme.colors.textSecondary },
                    ]}
                  >
                    Recurring
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setRecurrence('once')}
                  style={[
                    styles.segment,
                    { borderRadius: theme.radii.full },
                    recurrence === 'once' && { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.body,
                      { color: recurrence === 'once' ? theme.colors.onPrimary : theme.colors.textSecondary },
                    ]}
                  >
                    Just for Today
                  </Text>
                </Pressable>
              </View>
              <Text style={[theme.typography.small, { color: theme.colors.textTertiary, marginTop: theme.spacing.sm }]}>
                {recurrence === 'recurring'
                  ? 'Shows up on your daily list every day.'
                  : "Shows up today only, then it's gone."}
              </Text>

              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
                ]}
              >
                TIME
              </Text>
              <View
                style={[
                  styles.pickerWrap,
                  Platform.OS === 'ios' && { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radii.md },
                ]}
              >
                <DateTimePicker
                  value={time}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, selected) => selected && setTime(selected)}
                  themeVariant={theme.isDark ? 'dark' : 'light'}
                />
              </View>

              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
                ]}
              >
                CATEGORY
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  <Pressable
                    onPress={() => setCategoryId(null)}
                    style={[
                      styles.chip,
                      { borderRadius: theme.radii.full, borderColor: theme.colors.border },
                      categoryId === null && { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.textSecondary },
                    ]}
                  >
                    <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>None</Text>
                  </Pressable>

                  {(categories ?? []).map((category) => {
                    const selected = categoryId === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setCategoryId(category.id)}
                        style={[
                          styles.chip,
                          { borderColor: category.color, borderRadius: theme.radii.full },
                          selected && { backgroundColor: category.color },
                        ]}
                      >
                        <View style={[styles.chipDot, { backgroundColor: selected ? '#FFFFFF' : category.color }]} />
                        <Text
                          style={[
                            theme.typography.small,
                            { color: selected ? '#FFFFFF' : theme.colors.textPrimary },
                          ]}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => navigation.navigate('CategoryForm')}
                    style={[styles.chip, { borderRadius: theme.radii.full, borderColor: theme.colors.border, borderStyle: 'dashed' }]}
                  >
                    <Icon name="plus" size={12} color={theme.colors.textSecondary} strokeWidth={2.5} />
                    <Text style={[theme.typography.small, { color: theme.colors.textSecondary }]}>New</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Card>

            <PrimaryButton
              title={existing ? 'Save Changes' : 'Add Task'}
              onPress={handleSave}
              disabled={!title.trim()}
              loading={saving}
              style={{ marginTop: theme.spacing.xl }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  headerSpacer: { width: 40 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  pickerWrap: { alignItems: 'center' },
  segmented: { flexDirection: 'row', padding: 4, gap: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
});
