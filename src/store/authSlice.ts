import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthTokens } from '../types/auth';
import { tokenStorage } from '../utils/tokenStorage';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null; // Token đang hoạt động (Hub token hoặc Farm token)
  hubToken: string | null;    // Token Hub gốc dùng để khôi phục khi thoát Farm
  currentFarmId: string | null;
  subscriptionVersion: number;
}

// Đọc token từ đúng storage khi khởi động — hỗ trợ cả localStorage (rememberMe) và sessionStorage
const initialState: AuthState = {
  isAuthenticated: !!tokenStorage.get(tokenStorage.KEYS.accessToken),
  accessToken: tokenStorage.get(tokenStorage.KEYS.accessToken),
  hubToken: tokenStorage.get(tokenStorage.KEYS.hubToken),
  currentFarmId: (() => {
    const v = tokenStorage.get(tokenStorage.KEYS.currentFarmId);
    return v === 'null' || v === null ? null : v;
  })(),
  subscriptionVersion: 0,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * loginSuccess — được gọi sau khi đăng nhập thành công.
     * Hỗ trợ payload mở rộng với `rememberMe?: boolean`.
     */
    loginSuccess: (state, action: PayloadAction<AuthTokens & { rememberMe?: boolean }>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.hubToken = action.payload.accessToken;
      // Khi đăng nhập mới, xóa farm context cũ
      state.currentFarmId = null;

      tokenStorage.saveSession({
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        rememberMe: action.payload.rememberMe ?? false,
      });
      // Xóa farm context cũ
      tokenStorage.remove(tokenStorage.KEYS.currentFarmId);
    },

    setCredentials: (state, action: PayloadAction<AuthTokens & { rememberMe?: boolean }>) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.hubToken = action.payload.accessToken;
      state.currentFarmId = null;

      tokenStorage.saveSession({
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        rememberMe: action.payload.rememberMe ?? false,
      });
      tokenStorage.remove(tokenStorage.KEYS.currentFarmId);
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.hubToken = null;
      state.currentFarmId = null;
      tokenStorage.clear();
    },

    // Chọn farm - lưu farmToken làm accessToken hiện tại
    selectFarm: (state, action: PayloadAction<{ token: string; currentFarmId: string }>) => {
      state.currentFarmId = action.payload.currentFarmId;
      state.accessToken = action.payload.token;

      if (action.payload.currentFarmId) {
        tokenStorage.set(tokenStorage.KEYS.currentFarmId, action.payload.currentFarmId);
      } else {
        tokenStorage.remove(tokenStorage.KEYS.currentFarmId);
      }
      // Ghi farm token vào đúng storage (localStorage nếu rememberMe, sessionStorage nếu không)
      // Axios interceptor sẽ đọc đúng token này khi gọi API trong farm context
      tokenStorage.set(tokenStorage.KEYS.accessToken, action.payload.token);
    },

    // Thoát farm - quay về Hub bằng cách khôi phục accessToken từ hubToken
    clearFarmContext: (state) => {
      state.currentFarmId = null;
      if (state.hubToken) {
        state.accessToken = state.hubToken;
        tokenStorage.set(tokenStorage.KEYS.accessToken, state.hubToken);
      }
      tokenStorage.remove(tokenStorage.KEYS.currentFarmId);
    },

    setAccessToken: (state, action: PayloadAction<{ token: string; farmId?: string }>) => {
      state.accessToken = action.payload.token;
      tokenStorage.set(tokenStorage.KEYS.accessToken, action.payload.token);

      if (action.payload.farmId) {
        state.currentFarmId = action.payload.farmId;
        tokenStorage.set(tokenStorage.KEYS.currentFarmId, action.payload.farmId);
      } else {
        // Nếu setAccessToken không kèm farmId, coi như đây là hub token mới
        state.hubToken = action.payload.token;
        tokenStorage.set(tokenStorage.KEYS.hubToken, action.payload.token);
      }
    },

    refreshSubscription: (state) => {
      state.subscriptionVersion += 1;
    }
  }
});

export const { loginSuccess, setCredentials, logout, setAccessToken, selectFarm, clearFarmContext, refreshSubscription } = authSlice.actions;
export default authSlice.reducer;
