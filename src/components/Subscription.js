'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../services/config/config';
import { toast } from 'react-hot-toast';

const Subscription = ({ userEmail = '', onSuccess = () => {} }) => {
    const [email, setEmail] = useState(userEmail);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paystackLoaded, setPaystackLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => setPaystackLoaded(true);
            document.body.appendChild(script);

            return () => {
                document.body.removeChild(script);
            };
        }
    }, []);

    const handlePayment = async () => {
        console.log('=== SUBSCRIPTION PAYMENT INITIATED ===');
        console.log('Email:', email);
        console.log('User Email Prop:', userEmail);
        console.log('API URL:', API_URL);
        console.log('Full endpoint:', `${API_URL}/payment/subscribe`);

        if (!email) {
            console.error('Email validation failed: Email is empty');
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('Sending POST request to subscribe endpoint...');
            console.log('Request payload:', { email });

            const response = await axios.post(`${API_URL}/payment/subscribe`, {
                email,
            });

            console.log('✅ Subscribe API Response:', response);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            const { authorization_url, reference, access_code } = response.data;

            console.log('Extracted values:', {
                authorization_url,
                reference,
                access_code,
            });
            console.log('Extracted values:', {
                authorization_url,
                reference,
                access_code,
            });

            if (paystackLoaded && authorization_url) {
                console.log('Paystack loaded, opening payment modal...');
                console.log(
                    'Paystack Public Key:',
                    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
                );

                const paystackOptions = {
                    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                    email: userEmail,
                    amount: 10000 * 100,
                    ref: reference,
                    callback: (response) => {
                        console.log('💳 Paystack callback response:', response);
                        if (response.reference === reference) {
                            console.log('✅ Payment verified successfully!');
                            toast.success('Subscription successful!');
                            onSuccess();
                        } else {
                            console.error(
                                '❌ Payment verification failed - Reference mismatch'
                            );
                            console.error(
                                'Expected:',
                                reference,
                                'Got:',
                                response.reference
                            );
                            toast.error(
                                'Payment verification failed. Please contact support.'
                            );
                        }
                    },
                    onClose: () => {
                        console.log('ℹ️ Payment window closed by user');
                        toast('Payment window closed', { icon: 'ℹ️' });
                    },
                };

                console.log('Paystack options:', paystackOptions);
                const handler = window.PaystackPop.setup(paystackOptions);
                handler.openIframe();
            } else {
                console.error(
                    '❌ Payment processor not ready or no authorization URL'
                );
                console.error('Paystack loaded:', paystackLoaded);
                console.error('Authorization URL:', authorization_url);
                toast.error('Payment processor not ready. Please try again.');
            }
        } catch (error) {
            console.error('=== SUBSCRIPTION PAYMENT ERROR ===');
            console.error('Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error response:', error.response);
            console.error('Error response status:', error.response?.status);
            console.error('Error response data:', error.response?.data);
            console.error('Error response headers:', error.response?.headers);

            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Payment initialization failed';

            console.error('Displayed error message:', errorMessage);
            setError(errorMessage);
            toast.error(`Payment failed: ${errorMessage}`);
        } finally {
            console.log(
                'Payment request completed, setting isLoading to false'
            );
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window.PaystackPop !== 'undefined') {
            setPaystackLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => {
            setPaystackLoaded(true);
        };
        script.onerror = () => {
            console.error('Failed to load Paystack script');
            setPaystackLoaded(false);
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Subscribe to Etracka{' '}
                <span className="text-blue-600">(₦10,000/year)</span>
            </h2>

            <div className="mb-4">
                <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Email address
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                    }}
                    placeholder="Enter your email"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        error
                            ? 'border-red-500 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-blue-200'
                    }`}
                />
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <button
                onClick={handlePayment}
                disabled={isLoading || !paystackLoaded}
                className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isLoading || !paystackLoaded
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
            >
                {isLoading ? 'Processing...' : 'Pay Now'}
            </button>

            {!paystackLoaded && (
                <p className="mt-2 text-sm text-yellow-600">
                    Loading payment processor...
                </p>
            )}

            <p className="mt-4 text-sm text-gray-500">
                You will be redirected to Paystack for secure payment
                processing.
            </p>
        </div>
    );
};

export default Subscription;
