/**
 * tokenStorage — helper thống nhất để đọc/ghi auth tokens.
 *
 * Chiến lược lưu trữ:
 *  - rememberMe = true  → localStorage   (tồn tại qua các lần khởi động lại trình duyệt)
 *  - rememberMe = false → sessionStorage  (mất khi đóng tab/trình duyệt)
 *
 * Khi đọc token, kiểm tra localStorage trước rồi đến sessionStorage để hỗ trợ
 * cả hai trường hợp mà không cần biết trước người dùng đã chọn gì.
 */

const KEYS = {
  accessToken: 'accessToken',
  hubToken: 'hubToken',
  refreshToken: 'refreshToken',
  currentFarmId: 'currentFarmId',
  rememberMe: 'rememberMe',
} as const;

/** Lấy giá trị token — ưu tiên localStorage, sau đó sessionStorage */
function getToken(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

/** Ghi token vào đúng storage dựa theo rememberMe đang lưu */
function setToken(key: string, value: string): void {
  const persistent = localStorage.getItem(KEYS.rememberMe) === 'true';
  if (persistent) {
    localStorage.setItem(key, value);
  } else {
    sessionStorage.setItem(key, value);
  }
}

/** Xóa token khỏi cả hai storage */
function removeToken(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

/** Xóa tất cả auth data khỏi cả hai storage */
function clearAll(): void {
  const keysToRemove = [
    KEYS.accessToken,
    KEYS.hubToken,
    KEYS.refreshToken,
    KEYS.currentFarmId,
    KEYS.rememberMe,
  ];
  keysToRemove.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

/**
 * Thiết lập phiên đăng nhập mới.
 * Ghi rememberMe flag trước, sau đó ghi các token vào đúng storage.
 */
function saveSession(params: {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
}): void {
  // Lưu flag rememberMe vào localStorage để các lần đọc sau biết storage nào dùng
  if (params.rememberMe) {
    localStorage.setItem(KEYS.rememberMe, 'true');
  } else {
    localStorage.removeItem(KEYS.rememberMe);
  }

  setToken(KEYS.accessToken, params.accessToken);
  setToken(KEYS.hubToken, params.accessToken);
  setToken(KEYS.refreshToken, params.refreshToken);
}

/** Kiểm tra xem người dùng đang dùng "ghi nhớ đăng nhập" không */
function isPersistent(): boolean {
  return localStorage.getItem(KEYS.rememberMe) === 'true';
}

export const tokenStorage = {
  get: getToken,
  set: setToken,
  remove: removeToken,
  clear: clearAll,
  saveSession,
  isPersistent,
  KEYS,
};
