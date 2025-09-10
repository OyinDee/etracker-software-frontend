import { AxiosResponse } from 'axios';
import { getCookie, setCookie } from 'cookies-next';
import { GenericResponse, http } from './http';
import {
    LoginRequestProp,
    LoginResponse,
    OTPRequestProp,
    ResetPasswordProp,
    SignupRequestProp,
    User,
    VerifyOtpProp,
    UpdateAccountType,
} from 'interfaces';

export const AuthService = {
    async login(
        reqObj: LoginRequestProp
    ): Promise<AxiosResponse<GenericResponse<LoginResponse>>> {
        try {
            const { data } = await http.post('/api/v1/auth/login', reqObj);
            console.log(data);
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },
    async signup(
        reqObj: SignupRequestProp
    ): Promise<AxiosResponse<GenericResponse<User>>> {
        try {
            const { data } = await http.post('/api/v1/auth/register', reqObj);
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },
    async requestPasswordReset(reqObj: OTPRequestProp) {
        try {
            const { data } = await http.post(
                '/api/v1/auth/forgot-password',
                reqObj
            );
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },
    async changePassword() {},
    async resetPassword(reqObj: ResetPasswordProp) {
        try {
            const { data } = await http.post(
                '/api/v1/auth/reset-password',
                reqObj
            );
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },

    async updateUserAccountType(reqObj: UpdateAccountType) {
        try {
            const { data } = await http.post(
                '/api/v1/auth/register/update-user-account-type',
                reqObj
            );
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },

    async verifyOTP(reqObj: VerifyOtpProp) {
        try {
            const { data } = await http.post('/api/v1/auth/verify-otp', reqObj);
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },
    async verifyAccount(reqObj: {
        token: string;
    }): Promise<AxiosResponse<GenericResponse<null>>> {
        try {
            const { data } = await http.post(
                '/api/v1/auth/token/verify-token',
                reqObj
            );
            return Promise.resolve(data);
        } catch (error: any) {
            return Promise.reject(error?.response.data);
        }
    },
    OAuthLogin() {
        window.open(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google`,
            '_self'
        );
    },
};
