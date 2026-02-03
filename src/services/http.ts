import axios, { AxiosResponse } from 'axios';
import { useBoundStore } from 'store';

export type GenericResponse<K = any> = {
    success: boolean;
    message: string;
    data: K;
};

export type Response<T> = Promise<AxiosResponse<GenericResponse<T>>>;

export const http = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

http.interceptors.request.use(function (config) {
    const token = useBoundStore.getState().token;
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

http.interceptors.response.use(function (config) {
    return config;
});
