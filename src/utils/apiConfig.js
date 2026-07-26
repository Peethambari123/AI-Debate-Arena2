// Base API URL pointing to Render backend
export const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://ai-debate-backend-o9rt.onrender.com').replace(/\/$/, '');

/**
 * Builds a full API URL using the Render backend as base URL
 * @param {string} endpoint - e.g. '/auth/register' or '/auth/login'
 * @returns {string} e.g. 'https://ai-debate-backend-o9rt.onrender.com/auth/register'
 */
export const getApiUrl = (endpoint) => {
  if (!endpoint) return API_BASE_URL;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default getApiUrl;
