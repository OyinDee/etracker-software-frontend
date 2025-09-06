import DashboardLayout from 'layouts/dashboard';
import { ReactElement, useEffect, useState } from 'react';
import useAccountType from 'hooks/useAccountType';
import TenantDash from './tenants/tenatDashboard';
import LandlordDash from './landlordDashboard';
import { useAppStore } from 'hooks/useAppStore';

export default function Dashboard() {
    const { acctType, isLoading, error } = useAccountType();
    const states = useAppStore();
    const [loadingTimeout, setLoadingTimeout] = useState(false);

    // @ts-ignore
    const accountType = states?.user?.currentKyc?.accountType;

    // Set a timeout for loading state to prevent infinite loading
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoadingTimeout(true);
        }, 10000); // 10 seconds timeout

        return () => clearTimeout(timer);
    }, []);

    // Debug logging
    console.log('Dashboard Debug:', {
        acctType,
        isLoading,
        error,
        activeAccount: states?.activeAccount,
        accountType,
        isAuthenticated: states?.isAuthenticated,
        user: states?.user,
        currentKyc: states?.user?.currentKyc,
        loadingTimeout,
    });

    // Determine what dashboard to show based on available data
    const getDashboardComponent = () => {
        // Priority 1: Use accountType from currentKyc if available
        if (accountType !== undefined) {
            return accountType === 1 ? <TenantDash /> : <LandlordDash />;
        }

        // Priority 2: Use acctType if available
        if (acctType?.typeID !== undefined) {
            return acctType.typeID === 1 ? <TenantDash /> : <LandlordDash />;
        }

        // Priority 3: Use activeAccount as fallback
        if (states?.activeAccount !== undefined) {
            return states.activeAccount === 1 ? (
                <TenantDash />
            ) : (
                <LandlordDash />
            );
        }

        // Default to landlord dashboard if we can't determine
        return <LandlordDash />;
    };

    // Show loading only if we're actually loading and haven't timed out
    if (isLoading && !loadingTimeout && !accountType && !acctType) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show error state if there's an error fetching account types and no fallback data
    if (error && !accountType && !acctType && !states?.activeAccount) {
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

    // Show timeout error if loading has timed out
    if (loadingTimeout && !accountType && !acctType && !states?.activeAccount) {
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
