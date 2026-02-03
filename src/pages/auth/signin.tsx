import Input from 'components/base/form/Input';
import Button from 'components/base/Button';
import Link from 'next/link';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { ReactElement, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import PasswordRecoveryModal from 'components/PasswordRecoveryModal';
import { AuthService } from 'services';
import HomeLayout from 'layouts/home';
import {
    HiOutlineUser,
    HiOutlineLockClosed,
    HiOutlineEye,
    HiOutlineEyeOff,
    HiOutlineMail,
} from 'react-icons/hi';
import { useMutation } from 'react-query';
import { useAppStore } from 'hooks/useAppStore';
import { MutationKey } from 'react-query';
import Loader from 'components/base/Loader';
import { KycStatus, LoginResponse, GenericResponse } from 'interfaces';
import useLandlord from 'hooks/useLandlord';
import { createHistory } from 'services/newServices/history';

const schema = yup.object({
    email: yup
        .string()
        .email()
        .lowercase()
        .trim()
        .required('Enter email address'),
    password: yup.string().min(5).required('Enter password'),
});

function Signin() {
    const [isForgottenPassword, setIsForgottenPassword] = useState(false);
    const [showMessage, setShowMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const mutationKey: MutationKey = 'userLogin';
    const [isError, setIsError] = useState(false);
    const { mutateAsync: loginAsync, isLoading } = useMutation(
        mutationKey,
        AuthService.login
    );

    const states = useAppStore();
    const router = useRouter();
    const { tenantId, propertyId, returnUrl } = router.query;
    const { confirmTenant, isConfirmTenantLoading } = useLandlord();

    const {
        mutate: verifyAccountMutate,
        isLoading: isVerifyLoading,
        isSuccess,
    } = useMutation(
        async (reqObj: { token: string }) => {
            const response = await AuthService.verifyAccount(reqObj);
            return response.data;
        },
        {
            onSuccess(data: GenericResponse<any>) {
                setIsError(false);
                setShowMessage('Successful, you can login now!');
                router.push('/auth/signin');
            },
            onError(error: any) {
                setIsError(true);
                toast.error(error.message, { id: 'error' });
            },
            retry: 2,
        }
    );

    const handleNavigation = useCallback(
        async (path: string) => {
            if (isNavigating) return;
            setIsNavigating(true);
            try {
                await router.push(path);
            } catch (error) {
                console.error('Navigation error:', error);
                setIsNavigating(false);
            }
        },
        [isNavigating, router]
    );

    // Updated useEffect to prioritize isUserVerified
    useEffect(() => {
        if (
            states?.token &&
            states?.user?.isUserVerified !== undefined &&
            !router.asPath.includes('?') &&
            !isNavigating
        ) {
            if (states.user.isUserVerified === false) {
                handleNavigation('/onboarding');
            } else if (
                states.user.accountTypes?.includes(states?.activeAccount)
            ) {
                handleNavigation('/dashboard');
            } else {
                handleNavigation('/dashboard');
            }
        }
    }, [
        states?.token,
        states?.user?.isUserVerified,
        states?.user?.accountTypes,
        states?.activeAccount,
        handleNavigation,
        isNavigating,
        router.asPath,
    ]);

    const togglePasswordRecovery = () => {
        setIsForgottenPassword((prev) => !prev);
    };

    const handleMobileForgotPassword = () => {
        router.push('/auth/forgotten-password');
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    const {
        handleSubmit,
        register,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (values: any) => {
        console.log('routeQuery>>>', router.query);

        if (isLoading || isNavigating) return;

        setErrorMessage('');

        if (propertyId) {
            values.propertyId = propertyId;
        }

        states?.setActiveKyc(undefined);
        states?.setActiveAccount(undefined);

        try {
            const response = (await loginAsync(
                values
            )) as unknown as GenericResponse<LoginResponse>;
            console.log('Login response:', response);
            states?.setStartKycScreen && states?.setStartKycScreen('');
            reset();

            // Handle unverified email case
            if (
                response?.message?.includes('verification') ||
                !response?.data?.user
            ) {
                setShowMessage(
                    response?.message ||
                        'Please verify your email to continue. Check your inbox for the verification link.'
                );
                return;
            }

            if (response?.data) {
                const { user, tokens } = response.data;
                // Update user state with KYC information
                states?.setUser({
                    token: tokens,
                    user: {
                        ...user,
                        currentKyc: user.currentKyc || states?.user?.currentKyc,
                    },
                    isAuthenticated: true,
                });

                // Set active KYC if it exists
                if (user.currentKyc) {
                    states?.setActiveKyc(user.currentKyc);
                    states?.setActiveAccount(user.currentKyc.accountType);
                }

                // Handle redirection based on KYC status
                try {
                    // Check if there's a returnUrl to redirect back to
                    if (returnUrl && typeof returnUrl === 'string') {
                        await router.push(returnUrl);
                        return;
                    }

                    if (!user.accountTypes || user.accountTypes.length === 0) {
                        toast.success(
                            'Please select your account type to continue'
                        );
                        await router.push('/onboarding');
                        return;
                    }

                    // Use activeKyc from state which we just set
                    const currentKyc = states.activeKyc || user.currentKyc;

                    if (!currentKyc) {
                        // If no KYC exists, redirect to onboarding
                        await router.push('/onboarding');
                        return;
                    }

                    if (currentKyc.status === 'INCOMPLETE') {
                        await router.push('/onboarding/kyc');
                        return;
                    }

                    // If we get here, KYC is complete
                    await router.push('/dashboard');
                } catch (error) {
                    console.error('Navigation error:', error);
                    // Fallback to window.location if router.push fails
                    window.location.href = '/dashboard';
                }
            }
            setShowMessage(response?.message);
        } catch (error: any) {
            setIsNavigating(false);
            console.error('Login error:', error);
            toast.error(
                error?.message || 'Something went wrong please try again'
            );
        }
    };

    useEffect(() => {
        if (router?.query?.token) {
            verifyAccountMutate({ token: router.query.token as string });
        }
    }, [router?.query?.token, verifyAccountMutate]);

    return (
        <>
            {isVerifyLoading ? (
                <Loader loading={isVerifyLoading} />
            ) : (
                <div className="min-h-screen flex">
                    <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-900 to-indigo-900">
                        <div className="absolute inset-0">
                            <Image
                                src="https://images.pexels.com/photos/1446378/pexels-photo-1446378.jpeg"
                                alt="Modern building architecture"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-indigo-900/30"></div>
                        </div>

                        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
                            <div className="max-w-md">
                                <h2 className="text-4xl font-bold mb-6">
                                    Welcome Back
                                </h2>
                                <p className="text-xl text-blue-100 mb-8">
                                    Access your property management dashboard
                                    and continue managing your real estate
                                    portfolio.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                                        <span className="text-blue-100">
                                            Quick property insights
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                                        <span className="text-blue-100">
                                            Tenant communication tools
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                                        <span className="text-blue-100">
                                            Financial reporting
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 bg-gray-50">
                        <div className="w-full max-w-md">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                    <HiOutlineLockClosed className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Welcome Back
                                </h1>
                                <p className="text-gray-600">
                                    Sign in to your{' '}
                                    <span className="font-semibold text-blue-600">
                                        E-tracka
                                    </span>{' '}
                                    account
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                                {!!showMessage && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                            <p className="text-green-800 text-sm font-medium">
                                                {showMessage}
                                            </p>
                                            <button
                                                onClick={() =>
                                                    setShowMessage('')
                                                }
                                                className="ml-auto text-green-600 hover:text-green-800"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!!errorMessage && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <div className="flex items-center">
                                            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                            <p className="text-red-800 text-sm font-medium">
                                                {errorMessage}
                                            </p>
                                            <button
                                                onClick={() =>
                                                    setErrorMessage('')
                                                }
                                                className="ml-auto text-red-600 hover:text-red-800"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <HiOutlineMail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Enter your email address"
                                                {...register('email')}
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {String(errors.email.message)}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <HiOutlineLockClosed className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                placeholder="Enter your password"
                                                {...register('password')}
                                                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={
                                                    togglePasswordVisibility
                                                }
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPassword ? (
                                                    <HiOutlineEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                ) : (
                                                    <HiOutlineEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {String(
                                                    errors.password.message
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    typeof window !==
                                                        'undefined' &&
                                                    window.innerWidth >= 768
                                                ) {
                                                    togglePasswordRecovery();
                                                } else {
                                                    handleMobileForgotPassword();
                                                }
                                            }}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Forgot Password?
                                        </button>
                                        {isError && (
                                            <button
                                                type="button"
                                                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                                            >
                                                Resend token
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || isNavigating}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                    >
                                        {isLoading
                                            ? 'Signing in...'
                                            : isNavigating
                                            ? 'Redirecting...'
                                            : 'Sign In'}
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-300" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-500">
                                                or
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <span className="text-sm text-gray-600">
                                            Don&apos;t have an account?{' '}
                                            <Link
                                                href="/auth/signup"
                                                className="font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                Sign Up
                                            </Link>
                                        </span>
                                    </div>
                                </form>
                            </div>

                            <div className="text-center mt-8">
                                <p className="text-xs text-gray-500">
                                    Secure property management platform
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isForgottenPassword && (
                <PasswordRecoveryModal
                    open={isForgottenPassword}
                    onClose={togglePasswordRecovery}
                />
            )}
        </>
    );
}

Signin.getLayout = function getLayout(page: ReactElement) {
    return <HomeLayout showFooter={true}>{page}</HomeLayout>;
};

export default Signin;
