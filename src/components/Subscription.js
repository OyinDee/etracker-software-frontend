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
        if (!email) {
            setError('Email is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_URL}/payment/subscribe`, {
                email,
            });

            const { authorization_url, reference, access_code } = response.data;

            if (paystackLoaded && authorization_url) {
                const paystackOptions = {
                    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                    email: userEmail,
                    amount: 10000 * 100,
                    ref: reference,
                    callback: async (response) => {
                        if (response.reference === reference) {
                            try {
                                // Call backend to verify payment
                                const verifyRes = await axios.get(
                                    `${API_URL}/payment/verify/${reference}`
                                );
                                if (verifyRes.data.success) {
                                    toast.success(
                                        'Subscription successful and verified!'
                                    );
                                    onSuccess();
                                } else {
                                    toast.error(
                                        'Payment could not be verified. Please contact support.'
                                    );
                                }
                            } catch (err) {
                                toast.error(
                                    'Error verifying payment. Please try again.'
                                );
                            }
                        } else {
                            toast.error(
                                'Payment verification failed. Please contact support.'
                            );
                        }
                    },
                    onClose: () => {
                        toast('Payment window closed', { icon: 'ℹ️' });
                    },
                };

                const handler = window.PaystackPop.setup(paystackOptions);
                handler.openIframe();
            } else {
                toast.error('Payment processor not ready. Please try again.');
            }
        } catch (error) {
            console.error('Payment Error:', error);
            setError(
                error.response?.data?.message || 'Payment initialization failed'
            );
            toast.error('Payment failed. Please try again.');
        } finally {
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
