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
