import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SoilRecord } from '../types/soilRecord/soilRecord';

interface SoilRecordState {
  soilRecordsSnapshot: SoilRecord[];
}

const initialState: SoilRecordState = {
  soilRecordsSnapshot: [],
};

const soilRecordSlice = createSlice({
  name: 'soilRecord',
  initialState,
  reducers: {
    setSoilRecordsSnapshot: (state, action: PayloadAction<SoilRecord[]>) => {
      state.soilRecordsSnapshot = action.payload;
    },
    clearSoilRecordState: () => initialState,
  },
});

export const { setSoilRecordsSnapshot, clearSoilRecordState } = soilRecordSlice.actions;
export default soilRecordSlice.reducer;