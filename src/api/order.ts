import api from './axios';
import type { Order, PaginatedResult } from '../types/api.types';

export const orderApi = {
  checkout: () => api.post<Order>('/order/checkout').then((r) => r.data),
  getAll: (page = 1, limit = 10) =>
    api.get<PaginatedResult<Order>>('/order', { params: { page, limit } }).then((r) => r.data),
  getById: (id: number) => api.get<Order>(`/order/${id}`).then((r) => r.data),
  cancel: (id: number) => api.patch<Order>(`/order/${id}/cancel`).then((r) => r.data),
};
