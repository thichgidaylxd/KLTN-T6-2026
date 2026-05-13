import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthTokens } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null; // Token đang hoạt động (Hub token hoặc Farm token)
  hubToken: string | null;    // Token Hub gốc dùng để khôi phục khi thoát Farm
  currentFarmId: string | null;
  subscriptionVersion: number;
}

const getFromStorage = (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key);

const initialState: AuthState = {
  isAuthenticated: !!getFromStorage('accessToken'),
  accessToken: getFromStorage('accessToken'),
  hubToken: getFromStorage('hubToken'),
  currentFarmId: getFromStorage('currentFarmId') === 'null' ? null : getFromStorage('currentFarmId'),
  subscriptionVersion: 0
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AuthTokens & { rememberMe?: boolean }>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.hubToken = action.payload.accessToken;

      const storage = action.payload.rememberMe ? localStorage : sessionStorage;
      
      storage.setItem('accessToken', action.payload.accessToken);
      storage.setItem('hubToken', action.payload.accessToken);
      storage.setItem('refreshToken', action.payload.refreshToken);
      // Nếu ghi nhớ, hãy lưu luôn trạng thái này
      if (action.payload.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
    },

    setCredentials: (state, action: PayloadAction<AuthTokens>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.hubToken = action.payload.accessToken;

      // Giữ nguyên loại storage hiện tại đang dùng
      const isRemembered = localStorage.getItem('rememberMe') === 'true';
      const storage = isRemembered ? localStorage : sessionStorage;

      storage.setItem('accessToken', action.payload.accessToken);
      storage.setItem('hubToken', action.payload.accessToken);
      storage.setItem('refreshToken', action.payload.refreshToken);
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.hubToken = null;
      state.currentFarmId = null;
      localStorage.clear();
      sessionStorage.clear();
    },

    // Chọn farm - lưu farmToken làm accessToken hiện tại
    selectFarm: (state, action: PayloadAction<{ token: string; currentFarmId: string }>) => {
      state.currentFarmId = action.payload.currentFarmId;
      state.accessToken = action.payload.token;

      const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;

      if (action.payload.currentFarmId) {
        storage.setItem('currentFarmId', action.payload.currentFarmId);
      } else {
        storage.removeItem('currentFarmId');
      }
      storage.setItem('accessToken', action.payload.token);
    },

    // Thoát farm - quay về Hub bằng cách khôi phục accessToken từ hubToken
    clearFarmContext: (state) => {
      state.currentFarmId = null;
      const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
      if (state.hubToken) {
        state.accessToken = state.hubToken;
        storage.setItem('accessToken', state.hubToken);
      }
      storage.removeItem('currentFarmId');
    },

    setAccessToken: (state, action: PayloadAction<{ token: string; farmId?: string }>) => {
      state.accessToken = action.payload.token;
      const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
      storage.setItem('accessToken', action.payload.token);

      if (action.payload.farmId) {
        state.currentFarmId = action.payload.farmId;
        storage.setItem('currentFarmId', action.payload.farmId);
      } else {
        // Nếu setAccessToken không kèm farmId, coi như đây là hub token mới
        state.hubToken = action.payload.token;
        storage.setItem('hubToken', action.payload.token);
      }
    },


    refreshSubscription: (state) => {
      state.subscriptionVersion += 1;
    }
  }
});

export const { loginSuccess, setCredentials, logout, setAccessToken, selectFarm, clearFarmContext, refreshSubscription } = authSlice.actions;
export default authSlice.reducer;
