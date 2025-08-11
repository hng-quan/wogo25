import axios from 'axios';
import Toast from 'react-native-toast-message';
let isRefreshing = false;
let refreshSubscribers = [];

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export let apiForm = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'multipart/form-data',
    Accept: 'application/json',
  },
});

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
    if (!response.data.result) {
      isShowToast &&
        Toast.show({
          type: 'error',
          text1: response.data.message,
        });
      onLoading && onLoading(false);
      onError && onError(response.data);
    } else {
      onSuccess && onSuccess(response.data);
    }
    return response.data;
  } catch (error: any) {
    onLoading && onLoading(false);
    onError && onError(error.response?.data || error.message);
    console.log(`Error call api ${endpoint}:`, error.response?.data || error.message);
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

const _handleError = (error: any) => {};
