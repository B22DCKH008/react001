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

export const productApi = {
  getAll: (params?: ProductFilter) =>
    api.get<PaginatedResult<Product>>('/product', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<Product>(`/product/${id}`).then((r) => r.data),
};
