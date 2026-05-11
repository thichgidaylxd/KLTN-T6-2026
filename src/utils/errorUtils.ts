/**
 * Lấy HTTP status code từ lỗi Axios / wrapped error
 */
export function getErrorStatusCode(err: unknown): number | null {
  if (!err) return null;

  if (isObject(err)) {
    const e = err as Record<string, unknown>;

    // Direct status
    if (typeof e.status === 'number') return e.status;

    // response?.status
    const resp = e.response;
    if (resp && typeof resp === 'object') {
      const r = resp as Record<string, unknown>;
      if (typeof r.status === 'number') return r.status;
    }
  }

  return null;
}

/**
 * Check if value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Check if value has a string 'message' property
 */
function hasStringMessage(value: unknown): value is { message: string } {
  return (
    isObject(value) &&
    'message' in value &&
    typeof value.message === 'string'
  );
}

/**
 * Extract a human-readable error message
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return 'Có lỗi xảy ra';
  if (typeof err === 'string') return err;

  if (Array.isArray(err)) {
    return err
      .map(e => (hasStringMessage(e) ? e.message : JSON.stringify(e)))
      .join(', ');
  }

  if (typeof err !== 'object' || err === null) return 'Có lỗi xảy ra';

  const e = err as Record<string, unknown>;

  // Get data payload: Axios uses err.response?.data, some APIs use err.data directly
  let payload: unknown = undefined;
  const resp = e.response;
  if (resp && typeof resp === 'object') {
    const r = resp as Record<string, unknown>;
    payload = r.data;
  }
  if (payload === undefined && 'data' in e) {
    payload = e.data;
  }

  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;

    // errors array
    if (Array.isArray(p.errors)) {
      return p.errors
        .map(errItem => {
          if (hasStringMessage(errItem)) return errItem.message;
          if (typeof errItem === 'object' && errItem !== null) {
            const ei = errItem as Record<string, unknown>;
            if (ei.code !== undefined) return String(ei.code);
          }
          return JSON.stringify(errItem);
        })
        .join('; ');
    }

    // data object with field-level errors
    if (p.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
      const fieldErrors = p.data as Record<string, unknown>;
      const messages = Object.values(fieldErrors)
        .filter(val => typeof val === 'string')
        .join('; ');
      if (messages) return messages;
    }

    // message
    if (hasStringMessage(payload)) return payload.message;

    // code
    if (p.code !== undefined) return String(p.code);
  }

  if (hasStringMessage(err)) return err.message;

  return 'Có lỗi xảy ra';
}

export function extractDeleteTaskErrorMessage(err: unknown, taskStatus?: string): string {
  const statusCode = getErrorStatusCode(err);

  if (statusCode === 409) {
    const statusLabel = taskStatus ? ` "${taskStatus}"` : '';
    return `Không thể xóa công việc này vì trạng thái${statusLabel} đã được cập nhật. Chỉ có thể xóa công việc ở trạng thái ban đầu.`;
  }

  return extractErrorMessage(err);
}

export function extractDeletePhaseErrorMessage(error: unknown, statusName?: string, hasTasks?: boolean): string {
  let code: number | null = null;
  let message = '';

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    if (typeof err.status === 'number') code = err.status;

    const data = err.data;
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      if (typeof d.code === 'number') code = d.code;
      if (typeof d.message === 'string') message = d.message;
    }
  }

  const lowerMsg = message.toLowerCase();
  if (code === 409 || lowerMsg.includes('conflict') || lowerMsg.includes('task')) {
    if (hasTasks) {
      return 'Không thể xóa giai đoạn này vì đang có các công việc bên trong. Vui lòng xóa hết các công việc trước khi xóa giai đoạn.';
    }
    return `Giai đoạn đang ở trạng thái "${statusName || 'xử lý'}" nên không được phép xóa.`;
  }

  if (code === 403) return 'Bạn không có quyền xóa giai đoạn này.';
  if (code === 404) return 'Giai đoạn không tồn tại hoặc đã bị xóa trước đó.';
  return 'Đã có lỗi xảy ra khi xóa giai đoạn. Vui lòng thử lại sau.';
}

export function extractSkuCreateErrorMessage(err: unknown, skuCode: string): string {
  const statusCode = getErrorStatusCode(err);
  const backendMessage = extractErrorMessage(err);

  if (backendMessage && !backendMessage.includes('Dữ liệu đầu vào không hợp lệ')) {
    return backendMessage;
  }

  if (statusCode === 409) {
    return `Mã SKU "${skuCode}" đã tồn tại. Vui lòng chọn mã khác.`;
  }

  if (statusCode === 400) {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      const resp = e.response;
      if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        const data = r.data;
        if (data && typeof data === 'object') {
          const d = data as Record<string, unknown>;
          if (Array.isArray(d.errors)) {
            const messages = d.errors
              .map((errItem: unknown) => {
                if (hasStringMessage(errItem)) return errItem.message;
                if (isObject(errItem)) {
                  const ei = errItem as Record<string, unknown>;
                  if (ei.code !== undefined) return String(ei.code);
                }
                return JSON.stringify(errItem);
              })
              .join('; ');
            if (messages) return messages;
          }
        }
      }
    }
    return 'Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại các trường.';
  }

  return backendMessage || 'Không thể tạo SKU. Vui lòng thử lại sau.';
}

export function extractSupplierCreateErrorMessage(err: unknown, supplierCode: string): string {
  const statusCode = getErrorStatusCode(err);
  const backendMessage = extractErrorMessage(err);

  const supplierKeywords = ['nhà cung cấp', 'supplier', 'mã nhà cung cấp'];
  if (supplierKeywords.some(keyword => backendMessage?.toLowerCase().includes(keyword))) {
    return backendMessage;
  }

  if (statusCode === 409) {
    return `Mã nhà cung cấp "${supplierCode}" đã tồn tại. Vui lòng chọn mã khác.`;
  }

  if (statusCode === 400) {
    if (err && typeof err === 'object') {
      const e = err as Record<string, unknown>;
      const resp = e.response;
      if (resp && typeof resp === 'object') {
        const r = resp as Record<string, unknown>;
        const data = r.data;
        if (data && typeof data === 'object') {
          const d = data as Record<string, unknown>;
          if (Array.isArray(d.errors)) {
            const messages = d.errors
              .map((errItem: unknown) => {
                if (hasStringMessage(errItem)) return errItem.message;
                if (isObject(errItem)) {
                  const ei = errItem as Record<string, unknown>;
                  if (ei.code !== undefined) return String(ei.code);
                }
                return JSON.stringify(errItem);
              })
              .join('; ');
            if (messages) return messages;
          }
        }
      }
    }
    return 'Dữ liệu nhập không hợp lệ. Vui lòng kiểm tra lại các trường.';
  }

  return backendMessage || 'Không thể tạo nhà cung cấp. Vui lòng thử lại sau.';
}
