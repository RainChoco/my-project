import { API_BASE_URL as API_URL } from "../../../lib/apiClient";

export async function deleteHistoryEntry(id) {
    if (!id) {
        throw new Error('Missing id');
    }

    const response = await fetch(`${API_URL}/history/${id}`, {
        method: 'DELETE',
        credentials: 'include'
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Unable to delete history entry');
    }

    return response.json();
}

export default {
    deleteHistoryEntry
};
