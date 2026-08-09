import apiClient from "../../../lib/apiClient";

// Was previously a raw fetch() with `credentials: "include"` and no
// Authorization header - this app authenticates via a Bearer token (see
// apiClient.js), not cookies, so every call 401'd. apiClient attaches the
// real auth header.
export async function deleteHistoryEntry(id) {
    if (!id) {
        throw new Error('Missing id');
    }

    const { data } = await apiClient.delete(`/history/${id}`);
    return data;
}

export default {
    deleteHistoryEntry
};
