import DashboardHeader from 'components/dashboard/Header';
import Dashboard from '..';
import { useAppStore } from 'hooks/useAppStore';
import useTenant from 'hooks/useTenant';
import { useEffect, useState } from 'react';
import { User } from 'interfaces';
import { notifyTenant } from 'services/newServices/notify';
import Button from 'components/base/Button';
import { toast } from 'react-hot-toast';
import { Router, useRouter } from 'next/router';
import { getLandlordTenant } from 'services/newServices/tenant';
import { getAllTenants } from 'services/newServices/tenant';
import { getSubscriptionStatus } from 'utils/subscriptionUtils';

interface NotifyTenantType {
    id: string;
    email: string;
    phone: string;
    name: string;
}

export default function NotifyTenants() {
    const states = useAppStore();
    const router = useRouter();
    const tenantIds = states?.selectedTenants;
    const {
        getTenants,
        getTenantLoading,
        notifyTenant,
        isNotifyTenantLoading,
    } = useTenant();
    const [tenants, setTenants] = useState<NotifyTenantType[]>([]);
    const [landlordTenants, setLandlordTenants] = useState([]);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'email' | 'phone'>('email');

    useEffect(() => {
        // setLoading(true);

        async function fetchData() {
            const tenantData = await getLandlordTenant(states?.user?.id);
            console.log('okay', tenantData);
            setLandlordTenants(tenantData);
            // setLoading(false);
        }
        if (states?.user?.id) {
            fetchData();
        }
    }, [states]);

    useEffect(() => {
        if (!Array.isArray(tenantIds)) return;

        const arr = [] as NotifyTenantType[];

        const filteredTenants = landlordTenants.filter((tenant: any) =>
            tenantIds.includes(tenant.tenantData.userId)
        );

        filteredTenants.forEach(({ tenantData, userData }: any) => {
            const { userId } = tenantData;
            const { firstname, email, phone } = userData;

            arr.push({
                id: userId,
                email,
                phone,
                name: firstname,
            });
        });

        setTenants(arr);
    }, [tenantIds, landlordTenants]);

    const handleSendMessage = async () => {
        const subscriptionStatus = await getSubscriptionStatus(
            states?.user?.email || ''
        );

        // if (subscriptionStatus !== 'active') {
        //     toast.error(
        //         'You need an active subscription to perform this action.'
        //     );
        //     return;
        // }

        if (messageType === 'phone') {
            toast.error(
                'Text message currently unavailable, send an email instead.'
            );
            return;
        }
        if (message === '') {
            toast.error('Type out a message');
            return;
        }
        if (message !== '') {
            const requestObj = {
                tenantIds: states?.selectedTenants as string[],
                notifyMsg: message,
            };

            try {
                const res = await notifyTenant(requestObj);

                toast.success('Email Notification sent successfully');
                setMessage('');
                states?.resetTenantState();
                router.push('/dashboard/tenants');
            } catch (error: any) {
                toast.error(error.message);
            }
        }
    };

    return (
        <div>
            <DashboardHeader
                backButton={true}
                title="Notify Tenants"
                titleClassName="text-[18px]"
            />
            <section className="mt-8">
                <div>
                    <ul className="flex text-[#A9A9A9] font-semibold text-xl gap-20">
                        <li
                            className={`border-b borderb-transparent hover:text-black ${
                                messageType === 'phone' &&
                                'text-black border-b-[3px] border-b-[#2F42ED]'
                            }`}
                        >
                            <span
                                role="button"
                                // onClick={() => setMessageType('phone')}
                            >
                                Phonenumber
                            </span>
                        </li>
                        <li
                            className={`border-b borderb-transparent hover:text-black ${
                                messageType === 'email' &&
                                'text-black border-b-[3px] border-b-[#2F42ED]'
                            }`}
                        >
                            <span
                                role="button"
                                onClick={() => setMessageType('email')}
                            >
                                Email
                            </span>
                        </li>
                    </ul>

                    <div className="flex flex-row flex-wrap gap-3 mt-8">
                        {tenants.map((tenant) => (
                            <span
                                key={tenant.id}
                                className="px-2 py-1 bg-[#E3E5E5] rounded-lg inline-flex items-center gap-1"
                            >
                                {messageType === 'email'
                                    ? tenant.email
                                    : tenant.phone}

                                <button
                                    className=" border border-transparent hover:border hover:border-gray-600"
                                    onClick={() =>
                                        states?.setSelectedTenants(tenant.id)
                                    }
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="25"
                                        height="24"
                                        viewBox="0 0 25 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M6.77148 17.2431L12.0145 12.0001L17.2575 17.2431M17.2575 6.75708L12.0135 12.0001L6.77148 6.75708"
                                            stroke="#6B6A6A"
                                            stroke-width="1.5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                        />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="w-full max-w-[1112px]">
                    <div className="w-full mt-16 mb-12 h-[350px]">
                        <label htmlFor="message"></label>
                        <textarea
                            name="message"
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type here..."
                            className="w-full h-full block px-3 py-4 text-sm text-black 
                            rounded-[3px] border border-gray-300
                            appearance-none
                            focus:outline-none autofill:bg-gray-200
                            focus:ring-0 focus:border-primary-600"
                        ></textarea>
                    </div>

                    <div className="text-center">
                        <Button
                            className="w-1/4"
                            onClick={handleSendMessage}
                            isLoading={isNotifyTenantLoading}
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

NotifyTenants.auth = true;
NotifyTenants.getLayout = Dashboard.getLayout;
