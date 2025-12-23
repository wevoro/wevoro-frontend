import axios, { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios';

const isServer = typeof window === 'undefined';

const api: AxiosInstance = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_LOCAL_API_URL
      : process.env.NEXT_PUBLIC_PROD_API_URL,
  // withCredentials: true, // Ensure cookies are sent with requests
});

// Request interceptor: Attach the access token to headers
api.interceptors.request.use(
  async (config: any) => {
    let accessToken;
    if (isServer) {
      const { cookies } = await import('next/headers');
      accessToken = cookies().get('accessToken')?.value;
    }
    if (accessToken) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `${accessToken}`; // Make sure to include "Bearer"
    } else {
      if (typeof window !== 'undefined') {
        window.location.href = '/logout';
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

export default api;
