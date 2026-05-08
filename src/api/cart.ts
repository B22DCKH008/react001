import api from './axios';
import type { Cart } from '../types/api.types';

export const cartApi = {
  get: () => api.get<Cart>('/cart').then((r) => r.data),
  addItem: (product_id: number, quantity: number) =>
    api.post<Cart>('/cart/items', { product_id, quantity }).then((r) => r.data),
  updateItem: (itemId: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data),
  removeItem: (itemId: number) =>
    api.delete<Cart>(`/cart/items/${itemId}`).then((r) => r.data),
  clear: () => api.delete<Cart>('/cart').then((r) => r.data),
};
