import api from './axios';
import type { Category } from '../types/api.types';

export const categoryApi = {
  getAll: () => api.get<Category[]>('/category').then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<Category>('/category', data).then((r) => r.data),
  update: (id: number, data: { name?: string; description?: string }) =>
    api.patch<Category>(`/category/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete<Category>(`/category/${id}`).then((r) => r.data),
};
