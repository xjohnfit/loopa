import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateTaskMutation, useUpdateTaskMutation } from '../api/apiSlice';
import { useTheme } from '../theme';
import { Card, IconButton, PrimaryButton, Screen } from '../components/ui';

export default function TaskFormScreen({ route, navigation }: any) {
  const theme = useTheme();
  const existing = route.params?.task;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [time, setTime] = useState<Date>(
    existing ? new Date(`1970-01-01T${existing.time}`) : new Date()
  );

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const saving = isCreating || isUpdating;

  const handleSave = async () => {
    const timeStr = time.toTimeString().slice(0, 8); // HH:MM:SS
    if (existing) {
      await updateTask({ id: existing.id, title, time: timeStr });
    } else {
      await createTask({ title, time: timeStr });
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-left" onPress={() => navigation.goBack()} accessibilityLabel="Back" />
        <Text
          style={[theme.typography.title, { color: theme.colors.textPrimary, flex: 1, textAlign: 'center' }]}
        >
          {existing ? 'Edit Task' : 'New Task'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={16}
      >
        <View style={styles.content}>
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
          </Card>
        </View>

        <View style={[styles.footer, { padding: theme.spacing.lg }]}>
          <PrimaryButton
            title={existing ? 'Save Changes' : 'Add Task'}
            onPress={handleSave}
            disabled={!title.trim()}
            loading={saving}
          />
        </View>
      </KeyboardAvoidingView>
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
  flex: { flex: 1, justifyContent: 'space-between' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  pickerWrap: { alignItems: 'center' },
  footer: { paddingBottom: 4 },
});
