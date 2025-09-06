import { AccountType } from 'interfaces';
import { useEffect, useState, useCallback } from 'react';
import { useQuery } from 'react-query';
import { UserService } from 'services';
import { useAppStore } from './useAppStore';

const useAccountType = () => {
    const [acctType, setAcctType] = useState<AccountType>();
    const states = useAppStore();

    const {
        data: accountTypes,
        isLoading: isTypeLoading,
        error,
    } = useQuery('getAccountTypes', UserService.getAccountTypes, {
        // Don't refetch on window focus to prevent unnecessary updates
        refetchOnWindowFocus: false,
        // Enable the query if we have an activeAccount or if we're authenticated
        enabled: !!states?.activeAccount || !!states?.isAuthenticated,
        // Add retry logic
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Add stale time to prevent unnecessary refetches
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cache time
        cacheTime: 10 * 60 * 1000, // 10 minutes
    });

    const updateAccountType = useCallback(() => {
        if (states?.activeAccount && Array.isArray(accountTypes?.data)) {
            const foundAcctType = accountTypes?.data.find(
                (accountType: AccountType) =>
                    Number(accountType?.typeID) ===
                    Number(states?.activeAccount)
            );

            if (
                foundAcctType &&
                JSON.stringify(foundAcctType) !== JSON.stringify(acctType)
            ) {
                setAcctType(foundAcctType);
            }
        } else if (!states?.activeAccount) {
            // Clear account type if no active account
            setAcctType(undefined);
        }
    }, [states?.activeAccount, accountTypes?.data, acctType]);

    useEffect(() => {
        updateAccountType();
    }, [updateAccountType]);

    // Log errors for debugging
    useEffect(() => {
        if (error) {
            console.error('Error fetching account types:', error);
        }
    }, [error]);

    return {
        acctType,
        isLoading: isTypeLoading,
        error,
    };
};

export default useAccountType;
