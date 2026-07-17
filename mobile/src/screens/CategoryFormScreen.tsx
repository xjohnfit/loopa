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
import { useCreateCategoryMutation } from '../api/apiSlice';
import { useTheme } from '../theme';
import { CATEGORY_COLORS } from '../theme/categoryColors';
import { Card, Icon, IconButton, PrimaryButton, Screen } from '../components/ui';

export default function CategoryFormScreen({ navigation }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [createCategory, { isLoading }] = useCreateCategoryMutation();

  const handleSave = async () => {
    await createCategory({ name: name.trim(), color }).unwrap();
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
              New Category
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
                style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}
              >
                CATEGORY NAME
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
                placeholder="e.g. Health, Work, Home"
                placeholderTextColor={theme.colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoFocus
              />

              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
                ]}
              >
                COLOR
              </Text>
              <View style={styles.swatchRow}>
                {CATEGORY_COLORS.map((swatch) => {
                  const selected = swatch === color;
                  return (
                    <Pressable
                      key={swatch}
                      onPress={() => setColor(swatch)}
                      accessibilityRole="button"
                      accessibilityLabel={`Select color ${swatch}`}
                      style={[
                        styles.swatch,
                        { backgroundColor: swatch },
                        selected && { borderWidth: 3, borderColor: theme.colors.textPrimary },
                      ]}
                    >
                      {selected && <Icon name="check" size={16} color="#FFFFFF" strokeWidth={3} />}
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            <PrimaryButton
              title="Add Category"
              onPress={handleSave}
              disabled={!name.trim()}
              loading={isLoading}
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
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
