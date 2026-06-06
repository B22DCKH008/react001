import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../api/product';
import type { ProductFormData } from '../../api/product';
import { apiAssetUrl } from '../../api/axios';
import { categoryApi } from '../../api/category';
import type { Product } from '../../types/api.types';
import AdminNav from '../../components/admin/AdminNav';

type ProductAdminForm = {
  name: string;
  price: string;
  description: string;
  category_id?: number;
};

const emptyForm: ProductAdminForm = {
  name: '',
  price: '',
  description: '',
  category_id: undefined,
};

function formatPrice(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductAdminForm>(emptyForm);
  const [error, setError] = useState('');
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminProducts', page],
    queryFn: () => productApi.getAll({ page, limit: 10 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: categoryApi.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminProducts'] });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => productApi.uploadImage(id, file),
    onSuccess: () => {
      invalidate();
      setUploadingId(null);
      setError('');
    },
    onError: (err: any) => {
      setUploadingId(null);
      setError(err.response?.data?.message || 'Không thể upload ảnh');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productApi.create(data),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Lỗi tạo sản phẩm'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductFormData> }) => productApi.update(id, data),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Lỗi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openCreate = () => {
    setShowForm(true);
    setEditing(null);
    setForm(emptyForm);
    setError('');
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description ?? '',
      category_id: product.category?.id,
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Tên sản phẩm không được để trống');
      return;
    }
    const price = Number(form.price);
    if (!form.price.trim() || Number.isNaN(price) || price <= 0) {
      setError('Giá phải lớn hơn 0');
      return;
    }

    const payload: ProductFormData = {
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      category_id: form.category_id || undefined,
    };

    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Xóa sản phẩm "${product.name}"?`)) deleteMutation.mutate(product.id);
  };

  const products = data?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-6 lg:px-8">
      <AdminNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold uppercase text-gray-800">Quản lý sản phẩm</h1>
          <p className="mt-1 text-gray-500">Thêm, sửa, xóa và cập nhật hình ảnh sản phẩm.</p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-full bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-700"
          >
            + Thêm sản phẩm
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-[8px] border border-red-100 bg-red-50 p-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Tên sản phẩm *</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Tên sản phẩm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Giá *</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value.replace(/[^\d.]/g, '') })}
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Danh mục</label>
            <select
              value={form.category_id ?? ''}
              onChange={(event) => setForm({ ...form, category_id: event.target.value ? Number(event.target.value) : undefined })}
              className="w-full rounded-[8px] border border-gray-300 bg-white px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Không có</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="min-h-24 w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Mô tả sản phẩm"
            />
          </div>
          {error && <p className="md:col-span-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-red-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gray-300 px-5 py-2.5 font-bold text-gray-700 transition-colors hover:border-red-600 hover:text-red-600"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[8px] border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-red-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Ảnh</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="px-4 py-3 text-left">Giá</th>
                  <th className="px-4 py-3 text-left">Danh mục</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!products.length && (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-500">Chưa có sản phẩm</td></tr>
                )}
                {products.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {product.image_url ? (
                        <img src={apiAssetUrl(product.image_url)} alt={product.name} className="h-14 w-14 rounded-[8px] object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-gray-100 text-xs text-gray-400">Ảnh</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-400">#{product.id}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category?.name ?? 'Không có'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="rounded-full border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600">Sửa</button>
                        <button
                          onClick={() => {
                            setUploadingId(product.id);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploadMutation.isPending && uploadingId === product.id}
                          className="rounded-full border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600 disabled:opacity-50"
                        >
                          {uploadMutation.isPending && uploadingId === product.id ? '...' : 'Ảnh'}
                        </button>
                        <button onClick={() => handleDelete(product)} className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-100">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600 disabled:opacity-40"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">Trang {data.page} / {data.totalPages}</span>
              <button
                onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file && uploadingId !== null) uploadMutation.mutate({ id: uploadingId, file });
          event.target.value = '';
        }}
      />
    </div>
  );
}
