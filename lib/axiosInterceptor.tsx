import axios, { AxiosRequestConfig, AxiosError, AxiosInstance } from 'axios';

const isServer = typeof window === 'undefined';

const api: AxiosInstance = axios.create({
  baseURL: (
    process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_LOCAL_API_URL
      : process.env.NEXT_PUBLIC_PROD_API_URL
  )?.trim(),
});

// Request interceptor: Attach the access token to headers
api.interceptors.request.use(
  async (config: any) => {
    let accessToken;
    if (isServer) {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = cookies();
        accessToken = cookieStore.get('accessToken')?.value;
        console.log(
          '🔑 [Interceptor] Server-side cookie lookup:',
          accessToken ? `Found token (${accessToken.substring(0, 20)}...)` : 'NO TOKEN FOUND'
        );
        // Log all available cookies for debugging
        const allCookies = cookieStore.getAll();
        console.log(
          '🍪 [Interceptor] Available cookies:',
          allCookies.map((c: any) => c.name)
        );
      } catch (err: any) {
        console.error('❌ [Interceptor] Error reading cookies:', err.message);
      }
    }

    console.log(
      '📡 [Interceptor] Request:',
      config.method?.toUpperCase(),
      config.baseURL,
      config.url,
      '| Has token:',
      !!accessToken
    );

    if (accessToken) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `${accessToken}`;
    } else {
      console.warn('⚠️ [Interceptor] No access token available for request:', config.url);
      if (typeof window !== 'undefined') {
        window.location.href = '/logout';
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

export default api;
