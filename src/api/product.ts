import api from './axios';
import type { Product, PaginatedResult } from '../types/api.types';

export interface ProductFilter {
  page?: number;
  limit?: number;
  name?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductFormData {
  name: string;
  price: number;
  description?: string;
  category_id?: number;
}

export const productApi = {
  getAll: (params?: ProductFilter) =>
    api.get<PaginatedResult<Product>>('/product', { params }).then((r) => r.data),
  getById: (id: number) =>
    api.get<Product>(`/product/${id}`).then((r) => r.data),
  create: (data: ProductFormData) =>
    api.post<Product>('/product', data).then((r) => r.data),
  update: (id: number, data: Partial<ProductFormData>) =>
    api.patch<Product>(`/product/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete<Product>(`/product/${id}`).then((r) => r.data),
  restore: (id: number) => api.patch<Product>(`/product/${id}/restore`).then((r) => r.data),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<Product>(`/product/${id}/image`, form).then((r) => r.data);
  },
};
