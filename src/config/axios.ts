import axios from 'axios';
import { ENV } from './env';


export const axiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  paramsSerializer: {
    indexes: null // Tránh tự động thêm [] vào tên tham số mảng (ví dụ: sort)
  }
});

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const pickString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const extractApiMessage = (payload: unknown): string | null => {
  if (!isRecord(payload)) return null;

  const directMessage = pickString(payload.message);
  if (directMessage) return directMessage;

  // Common nested formats: { data: { message: ... } } or { error: { message: ... } }
  const nestedData = payload.data;
  if (isRecord(nestedData)) {
    const nestedMessage = pickString(nestedData.message);
    if (nestedMessage) return nestedMessage;
  }

  const nestedError = payload.error;
  if (isRecord(nestedError)) {
    const nestedErrorMessage = pickString(nestedError.message);
    if (nestedErrorMessage) return nestedErrorMessage;
  }

  // Validation errors: { errors: [{ message: "..." }] } | { errors: { field: "..." } }
  const errors = payload.errors;
  if (Array.isArray(errors)) {
    const messages = errors
      .map((item) => (isRecord(item) ? pickString(item.message) : pickString(item)))
      .filter((item): item is string => Boolean(item));
    if (messages.length > 0) return messages.join('; ');
  }
  if (isRecord(errors)) {
    const messages = Object.values(errors)
      .map((item) => (Array.isArray(item) ? item.map(pickString).filter(Boolean).join(', ') : pickString(item)))
      .filter((item): item is string => Boolean(item));
    if (messages.length > 0) return messages.join('; ');
  }

  return null;
};


// Request interceptor to add the access token
axiosInstance.interceptors.request.use(
  (config) => {
    // Không gửi token cho các API Auth (login, register, forgot-password, v.v.)
    // Ngoại trừ API refresh nếu cần (ở đây refresh dùng custom axios hoặc payload)
    const isPublicRoute =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register') ||
      config.url?.includes('/auth/refresh') ||
      config.url?.includes('/auth/verify');

    const getFromStorage = (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key);
    const token = getFromStorage('accessToken');

    if (token && config.headers && !isPublicRoute && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiration (401 error)
axiosInstance.interceptors.response.use(
  (response) => {
    const apiMessage = extractApiMessage(response?.data);
    if (apiMessage) {
      (response as any).apiMessage = apiMessage;
      if (isRecord(response.data)) {
        (response.data as UnknownRecord).__apiMessage = apiMessage;
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Unauthorized) và không phải là lỗi từ API Auth (để tránh loop vô tận)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAuthRoute =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh');

      if (!isAuthRoute) {
        originalRequest._retry = true;

        try {
          const getFromStorage = (key: string) => localStorage.getItem(key) || sessionStorage.getItem(key);
          const refreshToken = getFromStorage('refreshToken');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Gọi API refresh token
          const response = await axios.post(`${ENV.API_BASE_URL}/api/v1/auth/refresh`, {
            refreshToken
          });

          if (response.data.success) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            // 1. Cập nhật Storage (tự động chọn loại đang dùng)
            const isRemembered = localStorage.getItem('rememberMe') === 'true';
            const storage = isRemembered ? localStorage : sessionStorage;
            
            storage.setItem('accessToken', accessToken);
            storage.setItem('refreshToken', newRefreshToken);

            // 2. Cập nhật Header cho request cũ
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;

            // 3. Thực hiện lại request ban đầu
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Nếu refresh thất bại, logout người dùng
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    // Ưu tiên message từ API response; nếu không có thì dùng message mặc định của lỗi
    const responseMessage = extractApiMessage(error?.response?.data);
    const requestMessage = extractApiMessage(error?.data);
    const finalMessage = responseMessage ?? requestMessage ?? error.message;
    error.message = finalMessage;

    return Promise.reject(error);
  }
);