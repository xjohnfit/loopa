import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'https://api.loopa.codewithxjohn.com/api';

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
