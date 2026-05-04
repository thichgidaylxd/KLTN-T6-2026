import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskMaterial } from '../types/taskMaterial';

interface TaskMaterialState {
  materialsByTaskSnapshot: Record<string, TaskMaterial[]>;
}

const initialState: TaskMaterialState = {
  materialsByTaskSnapshot: {},
};

const taskMaterialSlice = createSlice({
  name: 'taskMaterial',
  initialState,
  reducers: {
    setTaskMaterialsSnapshot: (
      state,
      action: PayloadAction<{ taskKey: string; materials: TaskMaterial[] }>
    ) => {
      state.materialsByTaskSnapshot[action.payload.taskKey] = action.payload.materials;
    },
    clearTaskMaterialState: () => initialState,
  },
});

export const { setTaskMaterialsSnapshot, clearTaskMaterialState } = taskMaterialSlice.actions;
export default taskMaterialSlice.reducer;
