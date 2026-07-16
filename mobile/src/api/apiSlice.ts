import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../app/store';

const BASE_URL = 'https://api.loopa.codewithxjohn.com/api';

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  time: string;
  category_id: string | null;
  category_name: string | null;
  category_color: string | null;
}

export interface DayTask extends Task {
  completed: boolean;
}

export interface AuthResponse {
  token: string;
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Tasks', 'Day', 'Categories'],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),
    createCategory: builder.mutation<Category, { name: string; color: string }>({
      query: (body) => ({ url: '/categories', method: 'POST', body }),
      invalidatesTags: ['Categories'],
    }),
    getTasks: builder.query<Task[], void>({
      query: () => '/tasks',
      providesTags: ['Tasks'],
    }),
    createTask: builder.mutation<Task, { title: string; time: string; category_id: string | null }>({
      query: (body) => ({ url: '/tasks', method: 'POST', body }),
      invalidatesTags: ['Tasks', 'Day'],
    }),
    updateTask: builder.mutation<Task, { id: string; title: string; time: string; category_id: string | null }>({
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
  useRegisterMutation,
  useLoginMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetDayQuery,
  useToggleTaskCompletionMutation,
} = apiSlice;
