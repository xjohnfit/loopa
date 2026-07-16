import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import ManageTasksScreen from '../screens/ManageTasksScreen';
import TaskFormScreen from '../screens/TaskFormScreen';
import AuthScreen from '../screens/AuthScreen';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { bootstrapAuth } from '../features/auth/authSlice';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { token, status } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(bootstrapAuth());
  }, [dispatch]);

  const navigationTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      primary: theme.colors.primary,
      border: theme.colors.border,
    },
  };

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        {token ? (
          <>
            <Stack.Screen name="DailyTasks" component={DailyTasksScreen} />
            <Stack.Screen name="ManageTasks" component={ManageTasksScreen} />
            <Stack.Screen
              name="TaskForm"
              component={TaskFormScreen}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
