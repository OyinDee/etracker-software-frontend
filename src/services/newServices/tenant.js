import request from 'umi-request';
import { API_URL } from '../config/config';
import { useBoundStore } from '../../store';

// Helper function to get auth headers
const getAuthHeaders = () => {
    const token = useBoundStore.getState().token;
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        Authorization: `Bearer ${token}`,
    };
};

export async function getAllTenants() {
    return request(`${API_URL}/tenants/`, {
        method: 'get',
        headers: getAuthHeaders(),
    });
}

export async function getLandlordTenant(landordId) {
    try {
        const response = await request(
            `${API_URL}/tenants/landlord-properties/${landordId}`,
            {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${useBoundStore.getState().token}`,
                },
            }
        );
        return response || [];
    } catch (error) {
        // Handle 404 as an empty array (no tenants found)
        if (error.response?.status === 404) {
            return [];
        }
        // Re-throw other errors to be handled by the calling component
        throw error;
    }
}

export async function getDefaultTenant(landordId) {
    return request(`${API_URL}/tenants/default/landlord/${landordId}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function getAllTenantDefault() {
    return request(`${API_URL}/tenants/default/all`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function getTenantTransactions(tenantId) {
    return request(`${API_URL}/tenants/transactions/${tenantId}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function getTenantFiles(tenantId) {
    return request(`${API_URL}/tenants/files/${tenantId}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function getPropertyTenant(propertyId) {
    return request(`${API_URL}/tenants/property/${propertyId}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function getPropertyByTenantId(tenantId) {
    return request(`${API_URL}/tenants/tenant-property/${tenantId}`, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function createTenant(body) {
    return request(`${API_URL}/tenants/create`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        body: JSON.stringify(body),
    });
}

export async function createDefaultTenant(body) {
    return request(`${API_URL}/tenants/default/create-default`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        body: JSON.stringify(body),
    });
}

// delete tenant default
export async function deleteDefaultTenant(tenantId) {
    return request(`${API_URL}/tenants/default/delete-default/${tenantId}`, {
        method: 'delete',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
    });
}

export async function updateTenantRating(body, tenantId) {
    return request(`${API_URL}/tenants/update-rating/${tenantId}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        body: JSON.stringify(body),
    });
}

export async function completeTask(tenantId) {
    return request(`${API_URL}/tenants/completed/${tenantId}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        // body: JSON.stringify(body),
    });
}

export async function pendingTask(body, tenantId) {
    return request(`${API_URL}/tenants/pending/${tenantId}`, {
        method: 'put',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        body: JSON.stringify(body),
    });
}

export async function deleteTask(tenantId, body) {
    return request(`${API_URL}/tenants/delete/${tenantId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        body: JSON.stringify(body),
    });
}

export async function inviteTenant(body) {
    return request(`${API_URL}/tenants/invite`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            Authorization: `Bearer ${useBoundStore.getState().token}`,
        },
        body: JSON.stringify(body),
    });
}
