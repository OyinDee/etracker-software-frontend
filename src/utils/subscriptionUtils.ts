import { checkSubscription } from 'services/newServices/user';

export const getSubscriptionStatus = async (
    email: string
): Promise<string | null> => {
    console.log('=== GET SUBSCRIPTION STATUS ===');
    console.log('Input email:', email);

    try {
        console.log('Calling checkSubscription API...');
        const response = await checkSubscription(email);

        console.log('✅ Subscription status API response:', response);
        console.log('Response type:', typeof response);
        console.log(
            'Response keys:',
            response ? Object.keys(response) : 'null/undefined'
        );
        console.log('Subscription status value:', response?.subscriptionStatus);

        const status = response?.subscriptionStatus || null;
        console.log('Returning status:', status);

        return status;
    } catch (error) {
        console.error('=== SUBSCRIPTION STATUS ERROR ===');
        console.error('Error object:', error);
        console.error(
            'Error message:',
            error instanceof Error ? error.message : 'Unknown error'
        );
        console.error(
            'Error stack:',
            error instanceof Error ? error.stack : 'No stack trace'
        );

        return null;
    }
};
