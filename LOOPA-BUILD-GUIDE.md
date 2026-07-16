# Loopa — Daily Goal Task Planner
### Full build guide: Postgres → Express API → Expo/React Native + Redux Toolkit

---

## 0. Architecture at a glance

```
[Postgres]  <--pg-->  [Express API]  <--REST/JSON-->  [Expo RN App]
                                                          |
                                                  Redux Toolkit + RTK Query
```

- **Tasks** = recurring templates (time + title). Managed on the "Manage Tasks" screen.
- **Task Completions** = one row per task per date. Created/updated only when a user checks a task off on a given day.
- The "Daily Tasks" screen always asks the API: *"give me every task active on date X, with its completion status for X."*

---

## 1. PostgreSQL setup

### 1.1 Install & create the database

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16

# create db + user
psql postgres
```

```sql
CREATE DATABASE loopa;
CREATE USER loopa_user WITH ENCRYPTED PASSWORD 'change_me';
GRANT ALL PRIVILEGES ON DATABASE loopa TO loopa_user;
\c loopa
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()
```

### 1.2 Schema — `db/schema.sql`

```sql
-- Optional now, useful the moment you add auth/multi-device sync
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TIME NOT NULL,              -- e.g. 07:30:00
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ NULL
);

CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ NULL,
  UNIQUE (task_id, date)
);

CREATE INDEX idx_task_completions_date ON task_completions(date);
CREATE INDEX idx_tasks_user ON tasks(user_id);
```

Run it:

```bash
psql -U loopa_user -d loopa -f db/schema.sql
```

> For MVP with no auth, just insert one row into `users` manually and hardcode that `user_id` in the API — swap in real auth later without touching the schema.

---

## 2. Backend — Express API

### 2.1 Project setup

```bash
mkdir loopa-api && cd loopa-api
npm init -y
npm install express pg cors dotenv
npm install -D typescript ts-node-dev @types/express @types/node @types/cors
npx tsc --init
```

### 2.2 File structure

```
loopa-api/
  .env
  src/
    db.ts
    server.ts
    routes/
      tasks.ts
      days.ts
```

### 2.3 `.env`

```
DATABASE_URL=postgresql://loopa_user:change_me@localhost:5432/loopa
PORT=4000
```

### 2.4 `src/db.ts`

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### 2.5 `src/routes/tasks.ts` — Manage Tasks CRUD

```typescript
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// GET all tasks (Manage screen)
router.get('/', async (_req, res) => {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE is_active = true ORDER BY time ASC'
  );
  res.json(result.rows);
});

// CREATE task
router.post('/', async (req, res) => {
  const { title, time } = req.body;
  const result = await pool.query(
    `INSERT INTO tasks (title, time) VALUES ($1, $2) RETURNING *`,
    [title, time]
  );
  res.status(201).json(result.rows[0]);
});

// UPDATE task
router.put('/:id', async (req, res) => {
  const { title, time } = req.body;
  const result = await pool.query(
    `UPDATE tasks SET title = $1, time = $2 WHERE id = $3 RETURNING *`,
    [title, time, req.params.id]
  );
  res.json(result.rows[0]);
});

// ARCHIVE (soft delete) task
router.delete('/:id', async (req, res) => {
  await pool.query(
    `UPDATE tasks SET is_active = false, archived_at = now() WHERE id = $1`,
    [req.params.id]
  );
  res.status(204).send();
});

export default router;
```

### 2.6 `src/routes/days.ts` — Daily view + toggle completion

```typescript
import { Router } from 'express';
import { pool } from '../db';

const router = Router();

// GET tasks + completion status for a specific date
router.get('/:date', async (req, res) => {
  const { date } = req.params; // 'YYYY-MM-DD'
  const result = await pool.query(
    `SELECT t.id, t.title, t.time,
            COALESCE(tc.completed, false) AS completed
     FROM tasks t
     LEFT JOIN task_completions tc
       ON tc.task_id = t.id AND tc.date = $1
     WHERE t.created_at::date <= $1
       AND (t.archived_at IS NULL OR t.archived_at::date >= $1)
     ORDER BY t.time ASC`,
    [date]
  );
  res.json(result.rows);
});

// Toggle / upsert completion for a task on a date
router.patch('/:date/tasks/:taskId', async (req, res) => {
  const { date, taskId } = req.params;
  const { completed } = req.body;
  const result = await pool.query(
    `INSERT INTO task_completions (task_id, date, completed, completed_at)
     VALUES ($1, $2, $3, CASE WHEN $3 THEN now() ELSE NULL END)
     ON CONFLICT (task_id, date)
     DO UPDATE SET completed = $3,
                   completed_at = CASE WHEN $3 THEN now() ELSE NULL END
     RETURNING *`,
    [taskId, date, completed]
  );
  res.json(result.rows[0]);
});

export default router;
```

### 2.7 `src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tasksRouter from './routes/tasks';
import daysRouter from './routes/days';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/days', daysRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Loopa API running on :${PORT}`));
```

Run: `npx ts-node-dev src/server.ts`

---

## 3. Expo / React Native app

### 3.1 Create the project

```bash
npx create-expo-app loopa-app -t expo-template-blank-typescript
cd loopa-app
npm install @reduxjs/toolkit react-redux
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-community/datetimepicker
```

### 3.2 File structure

```
loopa-app/
  App.tsx
  src/
    app/
      store.ts
      hooks.ts
    api/
      apiSlice.ts
    features/
      ui/
        uiSlice.ts
    navigation/
      RootNavigator.tsx
    screens/
      DailyTasksScreen.tsx
      ManageTasksScreen.tsx
      TaskFormScreen.tsx
    components/
      DateHeader.tsx
      TaskItem.tsx
    utils/
      date.ts
```

### 3.3 `src/utils/date.ts`

```typescript
export const toISODate = (d: Date) => d.toISOString().split('T')[0]; // YYYY-MM-DD

export const addDays = (d: Date, amount: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

export const formatDisplayDate = (d: Date) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
```

### 3.4 `src/api/apiSlice.ts` — RTK Query (this is your main data layer)

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Use your machine's LAN IP for physical devices, not localhost
const BASE_URL = 'http://192.168.1.X:4000/api';

export interface Task {
  id: string;
  title: string;
  time: string;
}

export interface DayTask extends Task {
  completed: boolean;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['Tasks', 'Day'],
  endpoints: (builder) => ({
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: ['Tasks'],
    }),
    createTask: builder.mutation<Task, { title: string; time: string }>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Tasks', 'Day'],
    }),
    updateTask: builder.mutation<Task, { id: string; title: string; time: string }>({
      query: ({ id, ...body }) => ({ url: `/tasks/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Tasks', 'Day'],
    }),
    deleteTask: builder.mutation<void, string>({
      query: (id) => ({ url: `/tasks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tasks', 'Day'],
    }),
    getDay: builder.query<DayTask[], string>({
      query: (date) => `/days/${date}`,
      providesTags: ['Day'],
    }),
    toggleTaskCompletion: builder.mutation<DayTask, { date: string; taskId: string; completed: boolean }>({
      query: ({ date, taskId, completed }) => ({
        url: `/days/${date}/tasks/${taskId}`,
        method: 'PATCH',
        body: { completed },
      }),
      invalidatesTags: ['Day'],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetDayQuery,
  useToggleTaskCompletionMutation,
} = apiSlice;
```

### 3.5 `src/features/ui/uiSlice.ts` — just holds the selected date

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toISODate } from '../../utils/date';

interface UIState {
  selectedDateISO: string;
}

const initialState: UIState = {
  selectedDateISO: toISODate(new Date()),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDateISO = action.payload;
    },
  },
});

export const { setSelectedDate } = uiSlice.actions;
export default uiSlice.reducer;
```

### 3.6 `src/app/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import uiReducer from '../features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 3.7 `src/app/hooks.ts`

```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 3.8 `src/components/DateHeader.tsx`

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatDisplayDate } from '../utils/date';

interface Props {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function DateHeader({ date, onPrev, onNext }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onPrev} style={styles.arrow}>
        <Text style={styles.arrowText}>{'<'}</Text>
      </TouchableOpacity>
      <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
      <TouchableOpacity onPress={onNext} style={styles.arrow}>
        <Text style={styles.arrowText}>{'>'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  arrow: { padding: 12 },
  arrowText: { fontSize: 22, fontWeight: '600' },
  dateText: { fontSize: 16, fontWeight: '600' },
});
```

### 3.9 `src/components/TaskItem.tsx`

The checkbox is its own pressable button with a visible checkmark glyph when completed — separate from the row itself, so tapping the row text doesn't accidentally toggle it.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DayTask } from '../api/apiSlice';

interface Props {
  task: DayTask;
  onToggle: () => void;
}

export default function TaskItem({ task, onToggle }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={onToggle}
        style={[styles.checkbox, task.completed && styles.checkboxChecked]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <Text style={styles.time}>{task.time.slice(0, 5)}</Text>
      <Text style={[styles.title, task.completed && styles.titleDone]}>{task.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkmark: { color: '#fff', fontSize: 16, fontWeight: '700' },
  time: { width: 56, color: '#666' },
  title: { fontSize: 16, flexShrink: 1 },
  titleDone: { textDecorationLine: 'line-through', color: '#999' },
});
```

### 3.10 `src/screens/DailyTasksScreen.tsx`

```tsx
import React from 'react';
import { View, FlatList, Button, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setSelectedDate } from '../features/ui/uiSlice';
import { useGetDayQuery, useToggleTaskCompletionMutation } from '../api/apiSlice';
import { addDays, toISODate } from '../utils/date';
import DateHeader from '../components/DateHeader';
import TaskItem from '../components/TaskItem';

export default function DailyTasksScreen({ navigation }: any) {
  const dispatch = useAppDispatch();
  const selectedDateISO = useAppSelector((s) => s.ui.selectedDateISO);
  const selectedDate = new Date(selectedDateISO);

  const { data: tasks, isLoading } = useGetDayQuery(selectedDateISO);
  const [toggle] = useToggleTaskCompletionMutation();

  const changeDay = (amount: number) => {
    const next = addDays(selectedDate, amount);
    dispatch(setSelectedDate(toISODate(next)));
  };

  return (
    <View style={styles.container}>
      <DateHeader date={selectedDate} onPrev={() => changeDay(-1)} onNext={() => changeDay(1)} />
      <FlatList
        data={tasks ?? []}
        keyExtractor={(item) => item.id}
        refreshing={isLoading}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={() =>
              toggle({ date: selectedDateISO, taskId: item.id, completed: !item.completed })
            }
          />
        )}
      />
      <Button title="Manage Tasks" onPress={() => navigation.navigate('ManageTasks')} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, paddingTop: 60 } });
```

### 3.11 `src/screens/ManageTasksScreen.tsx`

```tsx
import React from 'react';
import { View, FlatList, Text, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { useGetTasksQuery, useDeleteTaskMutation } from '../api/apiSlice';

export default function ManageTasksScreen({ navigation }: any) {
  const { data: tasks } = useGetTasksQuery();
  const [deleteTask] = useDeleteTaskMutation();

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.time}>{item.time.slice(0, 5)}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TaskForm', { task: item })}>
              <Text style={styles.link}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={[styles.link, { color: 'red' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Button title="+ Add Task" onPress={() => navigation.navigate('TaskForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  time: { width: 56, color: '#666' },
  title: { flex: 1, fontSize: 16 },
  link: { color: '#2196F3', marginLeft: 8 },
});
```

### 3.12 `src/screens/TaskFormScreen.tsx`

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCreateTaskMutation, useUpdateTaskMutation } from '../api/apiSlice';

export default function TaskFormScreen({ route, navigation }: any) {
  const existing = route.params?.task;
  const [title, setTitle] = useState(existing?.title ?? '');
  const [time, setTime] = useState<Date>(
    existing ? new Date(`1970-01-01T${existing.time}`) : new Date()
  );

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Task name"
        value={title}
        onChangeText={setTitle}
      />
      <DateTimePicker
        value={time}
        mode="time"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(_, selected) => selected && setTime(selected)}
      />
      <Button title="Save" onPress={handleSave} disabled={!title.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16, gap: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, fontSize: 16 },
});
```

### 3.13 `src/navigation/RootNavigator.tsx`

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DailyTasksScreen from '../screens/DailyTasksScreen';
import ManageTasksScreen from '../screens/ManageTasksScreen';
import TaskFormScreen from '../screens/TaskFormScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="DailyTasks" component={DailyTasksScreen} options={{ title: 'Loopa' }} />
        <Stack.Screen name="ManageTasks" component={ManageTasksScreen} options={{ title: 'Manage Tasks' }} />
        <Stack.Screen name="TaskForm" component={TaskFormScreen} options={{ title: 'Task' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### 3.14 `App.tsx`

```tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/app/store';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <RootNavigator />
    </Provider>
  );
}
```

Run it: `npx expo start`

---

## 4. Run order

1. Start Postgres, run `schema.sql`.
2. `cd loopa-api && npx ts-node-dev src/server.ts`
3. Update `BASE_URL` in `apiSlice.ts` to your machine's LAN IP (find via `ipconfig`/`ifconfig`) — Expo Go on a phone can't reach `localhost`.
4. `cd loopa-app && npx expo start`

---

## 5. Natural next steps (not built above, but easy to layer on)

- **Auth**: add a real `users` table flow (JWT), scope all queries by `user_id`.
- **Streaks/stats**: aggregate `task_completions` by task to show completion %.
- **Reordering tasks**: add a `sort_order` int column to `tasks`.
- **Push reminders**: `expo-notifications` scheduled from each task's `time`.
