import React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import ManageTasksScreen from '../screens/ManageTasksScreen';
import TaskFormScreen from '../screens/TaskFormScreen';
import { useTheme } from '../theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const theme = useTheme();

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

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="DailyTasks" component={DailyTasksScreen} />
        <Stack.Screen name="ManageTasks" component={ManageTasksScreen} />
        <Stack.Screen
          name="TaskForm"
          component={TaskFormScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
