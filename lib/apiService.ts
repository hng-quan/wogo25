import axios from 'axios';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';
let isRefreshing = false;
let refreshSubscribers = [];

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
export const postAPI = async (
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

const _refreshToken = async () => {};

const _onRefreshed = (token: string) => {};

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 403) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        if (!isRefreshing) {
          isRefreshing = true;
          _refreshToken()
            .then(newToken => {
              // if (newToken) {
              //   _onRefreshed(newToken);
              // } else {
              //   // window.location.href = '/login';
              // }
            })
            .finally(() => {
              isRefreshing = false;
            });
        }

        return new Promise(resolve => {
          // refreshSubscribers.push(token => {
          //   if (token) {
          //     originalRequest.headers['authorization'] = `Bearer ${token}`;
          //     resolve(apiClient(originalRequest));
          //   } else {
          //     resolve(Promise.reject(error));
          //   }
          // });
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

export const postForm = async (
  endpoint: any,
  params = {},
  onSuccess?: (data: any) => void,
  onLoading?: (loading: boolean) => void,
  onError?: (error: any) => void,
  isShowToast?: boolean,
): Promise<any | undefined> => {
  try {
    onLoading && onLoading(true);

    const response = await apiForm.post(endpoint, params);
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
