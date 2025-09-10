export interface User {
    firstname: string;
    lastname: string;
    email: string;
    state: string;
    isEmailVerified: boolean;
    phone: string;
    gender: string;
    dob: string;
    country: string;
    area: string;
    fullAddress: string;
    isUserVerified: boolean;
    subscriptionStatus: string;
    createdAt: string;
    updatedAt: string;
    id: string;
    accountTypes: any[];
    currentKyc: CurrentKyc;
    profileImage: string;
    rating: number;
    landmark: string;
}

export interface User2 {
    firstname: string;
    lastname: string;
    email: string;
    state: string;
    isEmailVerified: boolean;
    phone: string;
    gender: string;
    dob: string;
    country: string;
    area: string;
    subscriptionStatus: string;
    fullAddress: string;
    isUserVerified: boolean;
    createdAt: string;
    updatedAt: string;
    id: string;
    accounttype: string;
    kycStage: number;
}

export interface LoginRequestProp {
    email: string;
    password: string;
}

export interface SignupRequestProp {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
}

export interface VerifyOtpProp {
    email: string;
    otp: string;
}

export interface OTPRequestProp {
    email: string;
}

export interface ResetPasswordProp {
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
}

export interface UpdateAccountType {
    email: string;
    accountType: number;
}

export interface LoginResponse {
    user: User;
    tokens: string;
}

export interface CreateAccountType {
    accountType: string;
    description: string;
}

export enum KycStatus {
    INCOMPLETE = 'INCOMPLETE',
    COMPLETE = 'COMPLETE',
    PENDING = 'PENDING',
    APRROVED = 'APRROVED',
    REJECTED = 'REJECTED',
}

export interface AccountType {
    accountType: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    typeID: number;
    id: string;
    status?: KycStatus;
}

export interface CurrentKyc {
    accountType: number;
    kycId?: number;
    kycStage: number;
    status: string;
    nextStage: number;
}

export interface GenericResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
