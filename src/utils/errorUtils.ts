/**
 * Extract a human-readable error message from various error formats (Axios, RTK Query, etc.)
 */
export const extractErrorMessage = (err: any): string => {
  if (!err) return 'Có lỗi xảy ra';
  if (typeof err === 'string') return err;
  
  // Handle array of errors
  if (Array.isArray(err)) {
    return err.map(e => e.message || JSON.stringify(e)).join(', ');
  }

  // Handle Axios or custom API responses
  const responseData = err.response?.data || err.data;
  
  if (responseData && typeof responseData === 'object') {
    const message = responseData.message || err.message;
    
    // If there's a specific data object with validation details
    if (responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
      const details = Object.values(responseData.data).join('; ');
      if (details) return details; // Prefer specific details if message is generic
    }
    
    // Handle array in data
    if (Array.isArray(responseData.data)) {
      return responseData.data.map((e: any) => e.message || e.code || JSON.stringify(e)).join('; ');
    }

    return message || responseData.code || JSON.stringify(responseData);
  }

  return err.message || 'Có lỗi xảy ra';
};
