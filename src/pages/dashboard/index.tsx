import DashboardLayout from 'layouts/dashboard';
import { ReactElement, useEffect, useState } from 'react';
import { useRouter } from 'next/router'; // Add useRouter for redirection
import useAccountType from 'hooks/useAccountType';
import TenantDash from './tenants/tenatDashboard';
import LandlordDash from './landlordDashboard';
import { useAppStore } from 'hooks/useAppStore';

export default function Dashboard() {
    const { acctType, isLoading, error } = useAccountType();
    const states = useAppStore();
    const router = useRouter();
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // @ts-ignore
    const accountType = states?.user?.currentKyc?.accountType;
    const isUserVerified = states?.user?.isUserVerified;
    const userAccountTypes = states?.user?.accountTypes; // Use accountTypes from user data

    // Redirect unverified users to onboarding
    useEffect(() => {
        // Only redirect if there's no KYC data at all
        if (
            states?.isAuthenticated &&
            !accountType &&
            !router.asPath.includes('/onboarding')
        ) {
            router.push('/onboarding');
        }
    }, [states?.isAuthenticated, accountType, router]);

    // Set a timeout for loading state
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingTimeout(true);
        }, 10000); // 10 seconds timeout
        return () => clearTimeout(timer);
    }, []);

    // Determine dashboard component
    const getDashboardComponent = () => {
        // Priority 1: Use accountType from currentKyc
        if (accountType !== undefined) {
            return accountType === 1 ? <TenantDash /> : <LandlordDash />;
        }

        // Priority 2: Use user.accountTypes
        if (Array.isArray(userAccountTypes) && userAccountTypes.length > 0) {
            return userAccountTypes.includes(1) ? (
                <TenantDash />
            ) : (
                <LandlordDash />
            );
        }

        // Priority 3: Use acctType from useAccountType
        if (acctType?.typeID !== undefined) {
            return acctType.typeID === 1 ? <TenantDash /> : <LandlordDash />;
        }

        // Priority 4: Use activeAccount as fallback
        if (states?.activeAccount !== undefined) {
            return states.activeAccount === 1 ? (
                <TenantDash />
            ) : (
                <LandlordDash />
            );
        }

        // Default to onboarding if no account type data is available
        router.push('/onboarding');
        return null;
    };

    // Show loading state
    if (
        isLoading &&
        !loadingTimeout &&
        !accountType &&
        !userAccountTypes?.length
    ) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (
        error &&
        !accountType &&
        !userAccountTypes?.length &&
        !states?.activeAccount
    ) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">
                        Failed to load account information
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Show timeout error
    if (
        loadingTimeout &&
        !accountType &&
        !userAccountTypes?.length &&
        !states?.activeAccount
    ) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">
                        Loading timed out. Please try again.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    return <section>{getDashboardComponent()}</section>;
}

Dashboard.auth = true;
Dashboard.getLayout = function getLayout(page: ReactElement) {
    return <DashboardLayout>{page}</DashboardLayout>;
};
