import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthTokens } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null; // Token đang hoạt động (Hub token hoặc Farm token)
  hubToken: string | null;    // Token Hub gốc dùng để khôi phục khi thoát Farm
  currentFarmId: string | null;
  subscriptionVersion: number;
}

const initialState: AuthState = {
  isAuthenticated: !!sessionStorage.getItem('accessToken'),
  accessToken: sessionStorage.getItem('accessToken'),
  hubToken: sessionStorage.getItem('hubToken'),
  currentFarmId: sessionStorage.getItem('currentFarmId') === 'null' ? null : sessionStorage.getItem('currentFarmId'),
  subscriptionVersion: 0
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AuthTokens>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.hubToken = action.payload.accessToken;

      sessionStorage.setItem('accessToken', action.payload.accessToken);
      sessionStorage.setItem('hubToken', action.payload.accessToken);
      sessionStorage.setItem('refreshToken', action.payload.refreshToken);
    },

    setCredentials: (state, action: PayloadAction<AuthTokens>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.hubToken = action.payload.accessToken;

      sessionStorage.setItem('accessToken', action.payload.accessToken);
      sessionStorage.setItem('hubToken', action.payload.accessToken);
      sessionStorage.setItem('refreshToken', action.payload.refreshToken);
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.hubToken = null;
      state.currentFarmId = null;
      sessionStorage.clear();
    },

    // Chọn farm - lưu farmToken làm accessToken hiện tại
    selectFarm: (state, action: PayloadAction<{ token: string; currentFarmId: string }>) => {
      state.currentFarmId = action.payload.currentFarmId;
      state.accessToken = action.payload.token;

      if (action.payload.currentFarmId) {
        sessionStorage.setItem('currentFarmId', action.payload.currentFarmId);
      } else {
        sessionStorage.removeItem('currentFarmId');
      }
      sessionStorage.setItem('accessToken', action.payload.token);
    },

    // Thoát farm - quay về Hub bằng cách khôi phục accessToken từ hubToken
    clearFarmContext: (state) => {
      state.currentFarmId = null;
      if (state.hubToken) {
        state.accessToken = state.hubToken;
        sessionStorage.setItem('accessToken', state.hubToken);
      }
      sessionStorage.removeItem('currentFarmId');
    },

    setAccessToken: (state, action: PayloadAction<{ token: string; farmId?: string }>) => {
      state.accessToken = action.payload.token;
      sessionStorage.setItem('accessToken', action.payload.token);

      if (action.payload.farmId) {
        state.currentFarmId = action.payload.farmId;
        sessionStorage.setItem('currentFarmId', action.payload.farmId);
      } else {
        // Nếu setAccessToken không kèm farmId, coi như đây là hub token mới
        state.hubToken = action.payload.token;
        sessionStorage.setItem('hubToken', action.payload.token);
      }
    },


    refreshSubscription: (state) => {
      state.subscriptionVersion += 1;
    }
  }
});

export const { loginSuccess, setCredentials, logout, setAccessToken, selectFarm, clearFarmContext, refreshSubscription } = authSlice.actions;
export default authSlice.reducer;
