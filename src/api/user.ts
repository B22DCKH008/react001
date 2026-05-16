import api from './axios';
import type { User } from '../types/api.types';

export const userApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>('/user/me/password', { currentPassword, newPassword })
      .then((r) => r.data),
  getAll: () => api.get<User[]>('/user').then((r) => r.data),
  updateRole: (id: number, role: 'user' | 'admin') =>
    api.patch<User>(`/user/${id}/role`, { role }).then((r) => r.data),
  delete: (id: number) => api.delete<User>(`/user/${id}`).then((r) => r.data),
  restore: (id: number) => api.patch<User>(`/user/${id}/restore`).then((r) => r.data),
};
