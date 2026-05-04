import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TaskAssignee } from '../types/taskAssignee';

interface TaskAssigneeState {
  assigneesByTaskSnapshot: Record<string, TaskAssignee[]>;
}

const initialState: TaskAssigneeState = {
  assigneesByTaskSnapshot: {},
};

const taskAssigneeSlice = createSlice({
  name: 'taskAssignee',
  initialState,
  reducers: {
    setTaskAssigneesSnapshot: (
      state,
      action: PayloadAction<{ taskKey: string; assignees: TaskAssignee[] }>
    ) => {
      state.assigneesByTaskSnapshot[action.payload.taskKey] = action.payload.assignees;
    },
    clearTaskAssigneeState: () => initialState,
  },
});

export const { setTaskAssigneesSnapshot, clearTaskAssigneeState } = taskAssigneeSlice.actions;
export default taskAssigneeSlice.reducer;
