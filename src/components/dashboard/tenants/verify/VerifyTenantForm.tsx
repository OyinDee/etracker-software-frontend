import { useState, FormEvent, useEffect } from 'react';

declare global {
    interface Window {
        PaystackPop: {
            setup: (options: any) => void;
        };
    }
}

import axios from 'axios';
import Button from 'components/base/Button';
import Checkbox from 'components/base/form/Checkbox';
import Input from 'components/base/form/Input';
import { API_URL } from 'services/config/config';
import { useRouter } from 'next/router';
import { useAppStore } from 'hooks/useAppStore';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface FormData {
    firstName: string;
    lastName: string;
    nin: string;
    email: string;
    phoneNumber: string;
    agreed: boolean;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    nin?: string;
    email?: string;
    phoneNumber?: string;
    agreed?: string;
}

export default function VerifyForm() {
    const router = useRouter();
    const states = useAppStore();
    const [tenantData, setTenantData] = useState<any>(null);
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        nin: '',
        email: '',
        phoneNumber: '',
        agreed: false,
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [paystackLoaded, setPaystackLoaded] = useState<boolean>(false);

    useEffect(() => {
        // Load tenant data from localStorage
        const storedTenant = localStorage.getItem('selectedTenant');
        if (storedTenant) {
            const tenant = JSON.parse(storedTenant);
            setTenantData(tenant);
            setFormData({
                firstName: tenant?.userData?.firstname || '',
                lastName: tenant?.userData?.lastname || '',
                nin: tenant?.tenantData?.nin || '',
                email: tenant?.userData?.email || '',
                phoneNumber: tenant?.userData?.phone || '',
                agreed: false,
            });
        }
    }, []);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.agreed) {
            setErrors({ agreed: 'You must agree to the terms' });
            return;
        }

        setLoading(true);
        try {
            const userEmail = states?.user?.email;
            const tenantId = tenantData?.tenantData?.id;
            const response = await axios.post<{
                authorization_url: string;
                reference: string;
                access_code: string;
            }>(`${API_URL}/payment/verify`, {
                userId: states?.user?.id,
                userEmail,
                tenantId,
                ...formData,
            });

            const { authorization_url, reference, access_code } = response.data;

            if (paystackLoaded && authorization_url) {
                const paystackOptions = {
                    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
                    email: userEmail,
                    amount: 1000 * 100,
                    ref: reference,
                    callback: (response: any) => {
                        if (response.reference !== reference) {
                            toast.error(
                                'Payment verification failed. Please contact support.'
                            );
                            // alert('Payment verification failed. Please contact support.');
                            return;
                        }
                        toast.success(
                            'Payment successful! Tenant verification process will begin shortly.'
                        );
                        // alert('Payment successful! Verification process will begin shortly.');
                    },
                    onClose: () => {
                        alert('Payment window closed');
                    },
                };

                const handler = (window as any).PaystackPop.setup(
                    paystackOptions
                );
                handler.openIframe();
            } else {
                alert('Payment processor is not ready. Please try again.');
            }
        } catch (error: any) {
            console.error('Error initializing payment:', error);
            toast.error('Payment initialization failed');
            // alert(error.response?.data?.error || 'Payment initialization failed');
        } finally {
            setLoading(false);
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

    if (!tenantData) {
        return <div className="bg-white p-10">Loading tenant data...</div>;
    }

    return (
        <form className="bg-white p-10" onSubmit={handleSubmit}>
            <section className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        First name
                    </label>
                    <div className="p-2 bg-gray-100 rounded-md">
                        {formData.firstName}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last name
                    </label>
                    <div className="p-2 bg-gray-100 rounded-md">
                        {formData.lastName}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        National identification number
                    </label>
                    {/* {formData.nin ? (
            <div className="p-2 bg-gray-100 rounded-md">
              {formData.nin}
            </div>
          ) : ( */}
                    <Input
                        label="Enter Tenants NIN"
                        type="text"
                        required
                        min={11}
                        placeholder="Enter NIN"
                        value={formData.nin}
                        onChange={(e) =>
                            setFormData({ ...formData, nin: e.target.value })
                        }
                        inputClassName="bg-white"
                    />
                    {/* )} */}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                    </label>
                    <div className="p-2 bg-gray-100 rounded-md">
                        {formData.email}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone number
                    </label>
                    <div className="p-2 bg-gray-100 rounded-md">
                        {formData.phoneNumber}
                    </div>
                </div>
            </section>

            <Checkbox
                className="mt-8"
                label={
                    <p>
                        By submitting this tenant verification request, You
                        agree with our{' '}
                        <span className="text-[#2F42EDD9] text-xs md:text-sm">
                            <Link
                                href="/terms"
                                className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Terms and Conditions
                            </Link>
                        </span>
                    </p>
                }
                // @ts-ignore
                name="agreed"
                checked={formData.agreed}
                // @ts-ignore
                onChange={(e) =>
                    setFormData({
                        ...formData,
                        agreed: (e.target as HTMLInputElement).checked,
                    })
                }
                error={errors.agreed}
            />

            {errors.agreed && (
                <p className="text-red-500 text-xs mt-1">{errors.agreed}</p>
            )}

            <div className="w-1/2 mx-auto mb-10 mt-16">
                <Button
                    className="w-full py-4"
                    type="submit"
                    disabled={loading || !paystackLoaded}
                >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                </Button>
            </div>
        </form>
    );
}
