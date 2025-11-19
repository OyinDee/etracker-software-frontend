import request from 'umi-request';
import { API_URL, USER_TOKEN } from '../config/config';

export async function updateUserAccountType(body, userId) {
    return request(`${API_URL}/user-profile/update-account-type/${userId}`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            Authorization: USER_TOKEN,
        },
        body: JSON.stringify(body),
    });
}

export async function fetchAllUsers() {
    return request(`${API_URL}/user-profile`, {
        method: 'get',
        headers: {
            Authorization: USER_TOKEN,
        },
    });
}

export async function checkSubscription(email) {
    console.log('=== CHECK SUBSCRIPTION SERVICE ===');
    console.log('Input email:', email);
    console.log('Encoded email:', encodeURIComponent(email));

    const endpoint = `${API_URL}/payment/subscription/status?email=${
        encodeURIComponent(email) || email
    }`;
    console.log('Full endpoint URL:', endpoint);
    console.log('Authorization token:', USER_TOKEN ? 'Present' : 'Missing');

    try {
        const response = await request(endpoint, {
            method: 'get',
            headers: {
                Authorization: USER_TOKEN,
            },
        });

        console.log('✅ Check subscription API response:', response);
        return response;
    } catch (error) {
        console.error('=== CHECK SUBSCRIPTION ERROR ===');
        console.error('Error:', error);
        throw error;
    }
}

export async function getVerificationRequests(userId) {
    return request(
        `${API_URL}/payment/verification/requests?userId=${userId}`,
        {
            method: 'get',
            headers: {
                Authorization: USER_TOKEN,
            },
        }
    );
}

export async function fetchAndFilterUsersByAccountType() {
    const allUsersResponse = await fetchAllUsers();
    const filteredUsers = allUsersResponse.filter(
        (user) =>
            // user.accountTypes.includes(1)
            user.currentKyc?.accountType === 1
    );
    return filteredUsers;
}
