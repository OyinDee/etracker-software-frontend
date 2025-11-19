import { AccountType, KycStatus } from 'interfaces';
import next from 'next';
import { NextRouter } from 'next/router';
import { OpenScreen, Role } from './enums';

export const urlSegment = (asPath: string) => {
    // console.log('assss', asPath);
    const pathSegments = asPath.split('/');
    // console.log(pathSegments, 'path');
    return pathSegments.length > 2
        ? pathSegments[2]
        : pathSegments[pathSegments.length - 1];
};

export const goBackToKyc = (
    screen: string,
    states: any,
    router: NextRouter
) => {
    const isOpenScreen = Object.values(OpenScreen).includes(
        screen as OpenScreen
    );
    if (
        states?.activeKyc &&
        states?.activeKyc?.status === KycStatus.INCOMPLETE
    ) {
        // checks if page user is routing to requires kyc onboarding or not

        if (isOpenScreen) {
            if (router) {
                if (screen !== 'kyc') {
                    states?.setScreen('');
                    return router.push(`/dashboard/${screen}`);
                }
                router.push(`/onboarding/${screen}`);
                // if (states?.activeKyc?.status === KycStatus.COMPLETE) {
                //     return states?.setScreen('awaitApproval');
                // }
                states?.setScreen('awaitApproval');
                return states?.setScreen('kyc');

                // return states?.setScreen(screen as OpenScreen);
            }
        } else {
            if (router) {
                // states?.setScreen(screen as OpenScreen);
                states?.setScreen('kyc');
                return router.push('/onboarding/kyc');
            }
        }
    } else if (
        states?.activeKyc &&
        states?.activeKyc?.status === KycStatus.COMPLETE
    ) {
        if (router) {
            if (isOpenScreen) {
                if (screen !== 'kyc') {
                    states?.setScreen('');
                    return router.push(`/dashboard/${screen}`);
                }
                states?.setActiveKyc(states?.user?.currentKyc);
                states?.setStep(states?.user?.currentKyc?.nextStage);
                router.push(`/onboarding/${screen}`);
                return states?.setScreen('awaitApproval');
            } else {
                states?.setScreen('awaitApproval');

                return router.push(`/dashboard`);
            }
        }
    } else {
        if (router) {
            states?.setScreen('');
            return router.push(`/dashboard/${screen}`);
        }
    }
};

export const goBackToKyc2 = (states: any, router?: NextRouter) => {
    // If no activeKyc or no status, allow navigation
    if (!states?.activeKyc || !states?.activeKyc?.status) {
        if (router) {
            states?.setScreen('');
        }
        return true;
    }

    const kycStatus = states.activeKyc.status;

    // If KYC is INCOMPLETE, redirect to KYC page
    if (kycStatus === KycStatus.INCOMPLETE) {
        if (router) {
            states?.setScreen('kyc');
            router.push('/onboarding/kyc');
        }
        return false;
    }

    // If KYC is COMPLETE or APPROVED, allow navigation
    if (kycStatus === KycStatus.COMPLETE || kycStatus === KycStatus.APRROVED) {
        if (router) {
            states?.setScreen('');
        }
        return true;
    }

    // If KYC is PENDING, show await approval message but don't navigate
    if (kycStatus === KycStatus.PENDING) {
        if (router) {
            states?.setScreen('awaitApproval');
        }
        return false;
    }

    // For any other status (REJECTED, etc.), allow navigation with cleared screen
    if (router) {
        states?.setScreen('');
    }
    return true;
};

export const switchAccount = (
    accountType: number,
    states: any,
    router: NextRouter
) => {
    const {
        user,
        activeKyc,
        user: { accountTypes, currentKyc },
        activeKyc: { status, accountType: account },
        setActiveAccount,
        setScreen,
        setActiveKyc,
    } = states;
    // Switch approved account
    if (accountTypes.includes(accountType)) {
        console.log('Kyc approved');
        setScreen('');
        setActiveAccount(accountType);
        setActiveKyc(undefined);
        states?.setStartKycScreen('');
        return router.push(`/dashboard`);
    } else {
        // Switch for an incompleted ongoing kyc account
        if (
            +accountType === +currentKyc?.accounttype &&
            currentKyc?.status === KycStatus.INCOMPLETE
        ) {
            console.log('Kyc incomplete');
            setScreen('kyc');
            setActiveAccount(accountType);
            states?.setStartKycScreen('');
            setActiveKyc({
                ...activeKyc,
                accountType,
            });
            return router.push('/onboarding/kyc');
        } else {
        }

        // Switch for a completed ongoing kyc account
        if (
            (+accountType === currentKyc?.accounttype &&
                currentKyc?.status === KycStatus.COMPLETE) ||
            currentKyc?.status === KycStatus.PENDING
        ) {
            console.log('Kyc completed not approved');
            setActiveAccount(accountType);
            states?.setStartKycScreen('');
            setActiveKyc({
                ...states?.activeKyc,
                accountType,
            });
            setScreen('awaitApproval');
            states?.setStartKycScreen('');
            return router.push(`/dashboard`);
        }
    }
};
export const extractAndCapitalizeWords = (str: string) => {
    // Split the string into an array of words
    const words = str?.split(' ');

    // Extract the initial character of each word and capitalize it
    const capitalizedWords = words?.map((word) => word.charAt(0).toUpperCase());

    return capitalizedWords;
};

export const getAccountType = (accountTypes: any, states: any) => {
    if (states?.activeAccount && Array.isArray(accountTypes?.data)) {
        const acctType = accountTypes?.data.find((accountype: AccountType) => {
            const typeID = states?.activeAccount;
            return Number(accountype?.typeID) === Number(typeID);
        });
        return acctType;
    }
};

export const searchHelper = (searchArray: any, searchInput: any): any => {
    const filteredArray = searchArray.filter((item: any) => {
        // Iterate over all properties of the item
        for (const key in item) {
            if (Object.prototype.hasOwnProperty.call(item, key)) {
                const propertyValue = item[key];
                // Check if the property value includes the search input
                if (
                    typeof propertyValue === 'string' &&
                    propertyValue
                        .toLowerCase()
                        .includes(searchInput.toLowerCase())
                ) {
                    return true; // Match found, include the item in the filtered array
                }
            }
        }
        return false; // No match found for any property, exclude the item from the filtered array
    });
    return filteredArray;
};

export const convertImageUrlToFile = (imageUrl: string): Promise<File> => {
    return new Promise((resolve, reject) => {
        fetch(imageUrl)
            .then((response) => response.blob())
            .then((blob) => {
                const file = new File([blob], imageUrl.split('/').pop() || '', {
                    type: blob.type,
                });
                resolve(file);
            })
            .catch((error) => {
                console.error(
                    'Error occurred while converting image to file:',
                    error
                );
                reject(error);
            });
    });
};

export const roleMenus: Record<Role, string[]> = {
    [Role.Landlord]: [
        'Dashboard',
        // 'Inbox',
        'Properties',
        // 'Maintenance',
        'Tenants',
        'Profile',
        // 'Settings',
    ],
    [Role.Tenant]: [
        'Dashboard',
        // 'Maintenance',
        'Properties',
        // 'Rent',
        // 'Apartment',
        // 'Inbox',
        'Profile',
    ],
    [Role.LandlordTenant]: [
        'Dashboard',
        'Maintenance',
        'Properties',
        'Tenant',
        'Rent',
        'Apartment',
        'Inbox',
        'Profile',
    ],
    [Role.PropertyAgentTenant]: [
        'Dashboard',
        'Maintenance',
        'Rent',
        'Apartment',
        'Inbox',
        'Profile',
    ],
    [Role.PropertyAgent]: [
        'Dashboard',
        'Inbox',
        'properties',
        'Maintenance',
        'Tenant',
        'Profile',
        'Settings',
    ],
};

export function generateRandomAlphanumeric(length = 6): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }

    return result;
}

function convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert file to base64.'));
            }
        };
        reader.readAsDataURL(file);
    });
}

export function convertDataUrlToImageFile(
    dataUrl: any,
    imageProfile: File | undefined
): File | undefined {
    // Convert the base64 data to binary data
    const binaryData = atob(dataUrl.split(',')[1]);

    // Create a Uint8Array from the binary data
    const array = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
    }

    // Get the original uploaded file
    const originalFile: File | undefined =
        imageProfile; /* Get the original uploaded file from your state or props */
    if (!originalFile) {
        console.error('Original file not found');
        return;
    }

    // Create a new File object with the cropped image data and the original filename
    const croppedImageFile = new File([array], originalFile.name, {
        type: originalFile.type,
    });

    return croppedImageFile;
}

// export const formatDate = (date: string) => {
//     return moment().format(date);
// };
