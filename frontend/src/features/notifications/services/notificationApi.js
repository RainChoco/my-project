import { apiClient } from '@/lib';

// Thin wrappers around backend/src/routes/notificationRoutes.js.
export async function fetchNotifications() {
  const { data } = await apiClient.get('/notifications');
  return data.data;
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data;
}
