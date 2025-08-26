import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { router } from 'expo-router';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
import { getItem, removeItem, setItem } from './storage';
let isRefreshing = false;
let refreshSubscribers: any[] = [];

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export let apiForm = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'multipart/form-data',
    Accept: 'application/json',
  },
});

const withAuthToken = async (config: InternalAxiosRequestConfig) => {
  const token = await getItem('access_token');
  if (token) {
    if (config.headers instanceof AxiosHeaders) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      // fallback nếu headers là object thường
      (config.headers as Record<string, any>)['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
};
apiClient.interceptors.request.use(withAuthToken, error => {
  return Promise.reject(error);
});
apiForm.interceptors.request.use(withAuthToken, error => {
  return Promise.reject(error);
});

/**
 * Gửi yêu cầu HTTP POST đến một endpoint API.
 *
 * @param endpoint - URL của endpoint API.
 * @param params - Dữ liệu sẽ được gửi trong body của yêu cầu.
 * @param onSuccess - Hàm callback được gọi khi yêu cầu thành công.
 * @param onLoading - Hàm callback để xử lý trạng thái loading.
 * @param onError - Hàm callback được gọi khi yêu cầu thất bại.
 * @param isShowToast - Cờ để hiển thị toast thông báo lỗi.
 * @returns Một Promise resolve với dữ liệu phản hồi hoặc undefined nếu có lỗi.
 */
export const jsonPostAPI = async (
  endpoint: any,
  params = {},
  onSuccess?: (data: any) => void,
  onLoading?: (loading: boolean) => void,
  onError?: (error: any) => void,
  isShowToast?: boolean,
): Promise<any | undefined> => {
  try {
    onLoading && onLoading(true);

    const response = await apiClient.post(endpoint, params);
    const data = response.data;

    // Kiểm tra kết quả
    if (data.result) {
      onSuccess?.(data);
    } else {
      isShowToast &&
        Toast.show({
          type: 'error',
          text1: data.message,
        });
      onLoading && onLoading(false);
      onError?.(data);
    }
    onLoading?.(false);
    return data;
  } catch (error: any) {
    onLoading?.(false);

    // Xử lý lỗi
    const errorData = error.response?.data || error.message;
    onError?.(errorData);
    _handleError(error);

    console.log(`Error call api ${endpoint}:`, errorData);
  }
};

const _refreshToken = async () => {
  console.log('===========Gọi _refreshToken==========');
  try {
    const token = await getItem('refresh_token');
    console.log('Token from storage', token);
    if (!token) return null;

    const response = await axios.post(process.env.EXPO_PUBLIC_API_URL + '/auth/refresh', {
      accessToken: token,
    });
    console.log('New token', response.data.result);

    const newAccessToken = response.data.result.accessToken;
    const newRefreshToken = response.data.result.refreshToken;

    if (newAccessToken) {
      // setAuthToken(newAccessToken);
      await setItem('access_token', newAccessToken);
      await setItem('refresh_token', newRefreshToken);

      console.log('Stored new tokens in storage', await getItem('access_token'), await getItem('refresh_token'));
      console.log('Đã lưu token mới vào storage');
      return newAccessToken;
    }
    return null;
  } catch (error) {
    console.log('Error refreshing new token', error);
    await removeItem('access_token');
    await removeItem('refresh_token');
    await removeItem('user');
    console.log('Removed tokens from storage because error _refreshToken');
    return null;
  }
};

const _onRefreshed = (token: string) => {
  console.log('============onRefreshed with token', token);
  console.log('Current refresh subscribers', refreshSubscribers);
  // Gọi lại tất cả các request đang chờ
  refreshSubscribers.forEach(callback => {
    console.log('Calling refresh subscriber with token', token);
    console.log('Subscriber callback', callback);
    callback(token);
  });
  refreshSubscribers = [];
};

apiForm.interceptors.response.use(
  response => response,
  async error => {
    console.log('apiForm error', error);
    const originalRequest = error.config;
    const status = error.response?.status;

    console.log('status apiForm', status);

    if (status === 401 && !originalRequest.url.includes('/refresh')) {
      console.log('Lỗi 401 in ApiForm');
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        console.log('API form Original request', originalRequest);

        if (!isRefreshing) {
          isRefreshing = true;
          _refreshToken()
            .then(newToken => {
              if (newToken) {
                _onRefreshed(newToken);
              } else {
                console.log('Chuyển đến trang login do không có token');
                router.replace('/(auth)/login');
              }
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise(resolve => {
          console.log('Adding request to refresh subscribers', resolve);
          refreshSubscribers.push((token: string) => {
            console.log('Promised with token', token);
            if (token) {
              originalRequest.headers['authorization'] = `Bearer ${token}`;
              resolve(apiForm(originalRequest));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }
    }
    _handleError(error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  response => response,
  async error => {
    console.log('apiClient error', error);
    const originalRequest = error.config;
    const status = error.response?.status;

    console.log('status apiClient', status);

    if (status === 401 && !originalRequest.url.includes('/refresh')) {
      console.log('Lỗi 401 in ApiClient');
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        console.log('API Client Original request', originalRequest);

        if (!isRefreshing) {
          isRefreshing = true;
          _refreshToken()
            .then(newToken => {
              if (newToken) {
                _onRefreshed(newToken);
              } else {
                console.log('Chuyển đến trang login do không có token');
                router.replace('/(auth)/login');
              }
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise(resolve => {
          console.log('Adding request to refresh subscribers', resolve);
          refreshSubscribers.push((token: string) => {
            console.log('Promised with token', token);
            if (token) {
              originalRequest.headers['authorization'] = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            } else {
              resolve(Promise.reject(error));
            }
          });
        });
      }
    }
    _handleError(error);
    return Promise.reject(error);
  },
);

const _handleError = (error: any) => {
  if (error.code === 'ERR_NETWORK') {
    Toast.show({
      type: 'error',
      text1: t('Lỗi kết nối'),
      text2: t('Vui lòng kiểm tra kết nối internet của bạn.'),
    });
    return;
  }
};

export const formPostAPI = async (
  endpoint: any,
  formData = {},
  onSuccess?: (data: any) => void,
  onLoading?: (loading: boolean) => void,
  onError?: (error: any) => void,
  isShowToast?: boolean,
): Promise<any | undefined> => {
  try {
    onLoading && onLoading(true);

    const response = await apiForm.post(endpoint, formData);
    const data = response.data;

    // Kiểm tra kết quả
    if (data.result) {
      onSuccess?.(data);
    } else {
      isShowToast &&
        Toast.show({
          type: 'error',
          text1: data.message,
        });
      onLoading && onLoading(false);
      onError?.(data);
    }
    return data;
  } catch (error: any) {
    onLoading?.(false);

    // Xử lý lỗi
    const errorData = error.response?.data || error.message;
    onError?.(errorData);
    _handleError(error);

    console.log(`Error call api ${endpoint}:`, errorData);
  }
};

export const formPutAPI = async (
  endpoint: any,
  formData = {},
  onSuccess?: (data: any) => void,
  onLoading?: (loading: boolean) => void,
  onError?: (error: any) => void,
  isShowToast?: boolean,
): Promise<any | undefined> => {
  try {
    onLoading && onLoading(true);

    const response = await apiForm.put(endpoint, formData);
    const data = response.data;

    // Kiểm tra kết quả
    if (data.result) {
      onSuccess?.(data);
    } else {
      isShowToast &&
        Toast.show({
          type: 'error',
          text1: data.message,
        });
      onLoading && onLoading(false);
      onError?.(data);
    }
    return data;
  } catch (error: any) {
    onLoading?.(false);

    // Xử lý lỗi
    const errorData = error.response?.data || error.message;
    onError?.(errorData);
    _handleError(error);

    console.log(`Error call api ${endpoint}:`, errorData);
  }
};
