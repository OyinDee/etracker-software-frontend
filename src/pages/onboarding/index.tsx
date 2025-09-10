import ToolTip from 'components/base/Tooltip';
import Checkbox from 'components/base/form/Checkbox';
import OnboardingLayout from 'layouts/onboarding';
import Link from 'next/link';
import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { UserService } from 'services';
import { AccountType } from 'interfaces';
import { useAppStore } from 'hooks/useAppStore';
import { useRouter } from 'next/router';
import Loader from 'components/base/Loader';
import { GET_ACCOUNT_TYPES_QUERY_KEY } from 'utils/constants';
import axios from 'axios'; // Import axios for making HTTP requests

export default function Onboarding() {
    const { data: accountTypes, isLoading } = useQuery(
        GET_ACCOUNT_TYPES_QUERY_KEY,
        UserService.getAccountTypes
    );

    const states = useAppStore();
    const router = useRouter();

    useEffect(() => {
        // Skip if no user or already processing
        if (!states?.user) return;

        const { currentKyc } = states.user;

        // Only proceed if we have KYC data
        if (currentKyc) {
            if (currentKyc.status === 'INCOMPLETE') {
                router.push('/onboarding/kyc');
            } else if (currentKyc.status === 'COMPLETE') {
                // Batch state updates together
                states.setActiveKyc(currentKyc);
                states.setScreen('');
                states.setActiveAccount(currentKyc.accountType);
                router.push('/dashboard');
            }
        }
    }, [states?.user?.currentKyc?.status]); // Only depend on status changes

    return (
        <section className="bg-brand-bg h-full">
            <section className="h-[96px] md:h-[196px] lg:h-[210px] md:ml-[-15%] lg:ml-[-5%] w-[105vw] 4xl:-ml-[25%] bg-[url('/hero-banner.png')] bg-cover bg-cOver bg-no-repeat" />

            <section className="px-[5%] md:px-[8%] lg:px-[6%] 2xl:px-[20%] 4xl:px-[15%] mb-40">
                <h1 className="text-3xl font-semibold text-center mt-10">
                    Choose your account Type
                </h1>
                <p className="text-center my-10 max-w-md mx-auto">
                    Click on the account type that suits your need to proceed.
                </p>
                <div className="mx-auto lg:w-1/2 flex flex-col">
                    {isLoading ? (
                        <Loader loading={isLoading} />
                    ) : (
                        Array.isArray(accountTypes?.data) &&
                        accountTypes?.data.map((account) => {
                            return (
                                <NavButton
                                    key={account?.id}
                                    tooltip="List and manage your properties, receive rental applications, create lease applications, accept rent, manage maintenance requests e.t.c"
                                    handleClick={async () => {
                                        try {
                                            // Make POST request to update account type
                                            const response = await axios.post(
                                                `https://etracker-software-api.onrender.com/api/v1/user-profile/update-account-type/${states?.user?.id}`,
                                                {
                                                    accountType:
                                                        account?.typeID,
                                                },
                                                {
                                                    headers: {
                                                        Authorization: `Bearer ${states?.token}`,
                                                    },
                                                }
                                            );

                                            // Update state based on successful response
                                            states?.setStartKycScreen(
                                                'onboarding'
                                            );
                                            states?.setActiveKyc({
                                                accountType: account?.typeID,
                                                kycStage: 1,
                                                nextStage: 2,
                                                status: 'INCOMPLETE',
                                            });
                                            states?.setActiveAccount(
                                                account?.typeID
                                            );
                                            router.push('/onboarding/kyc');
                                        } catch (error: any) {
                                            console.error(
                                                'Error updating account type:',
                                                error
                                            );
                                            // Handle errors (e.g., show toast notification)
                                            alert(
                                                error.response?.data?.message ||
                                                    'Failed to update account type. Please try again.'
                                            );
                                        }
                                    }}
                                >
                                    <div className="ml-5">
                                        <h3 className="font-semibold text-lg">
                                            {account?.accountType === 'Landlord'
                                                ? `Property Manager / ${account?.accountType}`
                                                : account?.accountType}
                                        </h3>
                                        <p className="text-base">
                                            {account?.description}
                                        </p>
                                    </div>
                                </NavButton>
                            );
                        })
                    )}
                </div>
            </section>
        </section>
    );
}

function NavButton({
    children,
    tooltip,
    handleClick,
}: {
    children: ReactNode;
    tooltip: string;
    handleClick: () => void;
}) {
    const [checked, setChecked] = useState(false);

    const onMouseOver = () => setChecked(true);
    const onMouseOut = () => setChecked(false);

    return (
        <>
            <button
                onMouseOver={onMouseOver}
                onMouseOut={onMouseOut}
                className="group flex gap-5 bg-white shadow-lg rounded-xl p-5 border hover:border-primary-600 mb-8 text-left"
                onClick={(e) => {
                    e.preventDefault();
                    handleClick();
                }}
            >
                <Checkbox circular checked={checked} readOnly />
                {children}
                <ToolTip
                    className="ml-auto"
                    icon={
                        <svg
                            width="21"
                            height="20"
                            viewBox="0 0 21 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M9.5 13H11.5V15H9.5V13ZM9.5 5H11.5V11H9.5V5ZM10.5 0C4.97 0 0.5 4.5 0.5 10C0.5 12.6522 1.55357 15.1957 3.42893 17.0711C4.35752 17.9997 5.45991 18.7362 6.67317 19.2388C7.88642 19.7413 9.18678 20 10.5 20C13.1522 20 15.6957 18.9464 17.5711 17.0711C19.4464 15.1957 20.5 12.6522 20.5 10C20.5 8.68678 20.2413 7.38642 19.7388 6.17317C19.2362 4.95991 18.4997 3.85752 17.5711 2.92893C16.6425 2.00035 15.5401 1.26375 14.3268 0.761205C13.1136 0.258658 11.8132 0 10.5 0ZM10.5 18C8.37827 18 6.34344 17.1571 4.84315 15.6569C3.34285 14.1566 2.5 12.1217 2.5 10C2.5 7.87827 3.34285 5.84344 4.84315 4.34315C6.34344 2.84285 8.37827 2 10.5 2C12.6217 2 14.6566 2.84285 16.1569 4.34315C17.6571 5.84344 18.5 7.87827 18.5 10C18.5 12.1217 17.6571 14.1566 16.1569 15.6569C14.6566 17.1571 12.6217 18 10.5 18Z"
                                fill="#131313"
                                fillOpacity="0.55"
                            />
                        </svg>
                    }
                    content={tooltip}
                />
            </button>
        </>
    );
}

Onboarding.auth = true;

Onboarding.getLayout = function getLayout(page: ReactElement) {
    return <OnboardingLayout>{page}</OnboardingLayout>;
};
