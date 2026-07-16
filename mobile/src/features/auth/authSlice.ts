import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { deleteToken, loadToken, saveToken } from './tokenStorage';

interface AuthState {
  token: string | null;
  status: 'loading' | 'ready';
}

const initialState: AuthState = {
  token: null,
  status: 'loading',
};

export const bootstrapAuth = createAsyncThunk('auth/bootstrap', async () => {
  return (await loadToken()) ?? null;
});

export const signIn = createAsyncThunk('auth/signIn', async (token: string) => {
  await saveToken(token);
  return token;
});

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await deleteToken();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.token = action.payload;
        state.status = 'ready';
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.token = action.payload;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.token = null;
      });
  },
});

export default authSlice.reducer;
