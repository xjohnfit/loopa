import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppDispatch } from '../app/hooks';
import { apiSlice, useLoginMutation, useRegisterMutation } from '../api/apiSlice';
import { signIn } from '../features/auth/authSlice';
import { useTheme } from '../theme';
import { Card, PrimaryButton, Screen } from '../components/ui';

export default function AuthScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const busy = loggingIn || registering;
  const canSubmit = email.trim().length > 0 && password.length >= (mode === 'register' ? 8 : 1);

  const handleSubmit = async () => {
    setErrorMessage(null);
    try {
      const action = mode === 'login' ? login : register;
      const result = await action({ email: email.trim(), password }).unwrap();
      dispatch(apiSlice.util.resetApiState());
      await dispatch(signIn(result.token));
    } catch (err: any) {
      setErrorMessage(err?.data?.error ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={[theme.typography.largeTitle, { color: theme.colors.primary, textAlign: 'center' }]}>
            Loopa
          </Text>
          <Text
            style={[
              theme.typography.bodyRegular,
              { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.xs, marginBottom: theme.spacing.xxl },
            ]}
          >
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>

          <Card style={{ padding: theme.spacing.lg }}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }]}>
              EMAIL
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
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
            />

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
              ]}
            >
              PASSWORD
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
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              placeholderTextColor={theme.colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={mode === 'register' ? 'newPassword' : 'password'}
            />

            {errorMessage && (
              <Text style={[theme.typography.small, { color: theme.colors.danger, marginTop: theme.spacing.md }]}>
                {errorMessage}
              </Text>
            )}

            <PrimaryButton
              title={mode === 'login' ? 'Log In' : 'Sign Up'}
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={busy}
              style={{ marginTop: theme.spacing.xl }}
            />
          </Card>

          <Text
            onPress={() => {
              setErrorMessage(null);
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={[
              theme.typography.body,
              { color: theme.colors.primary, textAlign: 'center', marginTop: theme.spacing.xl },
            ]}
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24 },
});
