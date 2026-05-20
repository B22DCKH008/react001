import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product';
import type { ProductFilter } from '../api/product';
import { apiAssetUrl } from '../api/axios';

export default function HomePage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ProductFilter>({});
  const [form, setForm] = useState({ name: '', minPrice: '', maxPrice: '' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, filters],
    queryFn: () => productApi.getAll({ page, limit: 12, ...filters }),
    staleTime: 30_000,
  });

  const handleFilter = (e: FormEvent) => {
    e.preventDefault();
    setPage(1);
    setFilters({
      name: form.name || undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
    });
  };

  const handleReset = () => {
    setForm({ name: '', minPrice: '', maxPrice: '' });
    setFilters({});
    setPage(1);
  };

  const hasFilter = filters.name || filters.minPrice !== undefined || filters.maxPrice !== undefined;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Danh sách sản phẩm</h1>

      {/* Filter form */}
      <form onSubmit={handleFilter} className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Tên sản phẩm</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tìm theo tên..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Giá từ (₫)</label>
          <input
            type="number"
            value={form.minPrice}
            onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
            placeholder="0"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Giá đến (₫)</label>
          <input
            type="number"
            value={form.maxPrice}
            onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
            placeholder="∞"
            min={0}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Lọc
        </button>
        {hasFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Xoá bộ lọc
          </button>
        )}
      </form>

      {/* Product grid */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Đang tải...</div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500">Không thể tải sản phẩm</div>
      ) : !data?.data.length ? (
        <div className="text-center py-16 text-gray-500">Không có sản phẩm nào</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {data.data.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                {product.image_url ? (
                  <img
                    src={apiAssetUrl(product.image_url)}
                    alt={product.name}
                    className="w-full h-36 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="bg-gray-100 rounded-lg h-36 mb-3 flex items-center justify-center text-gray-400 text-sm">
                    Chưa có ảnh
                  </div>
                )}
                <h3 className="font-semibold text-gray-800 mb-1 truncate">{product.name}</h3>
                {product.category && (
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full mb-2">
                    {product.category.name}
                  </span>
                )}
                <p className="text-blue-600 font-bold">
                  {Number(product.price).toLocaleString('vi-VN')} ₫
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
