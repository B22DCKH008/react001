import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../../api/category';
import type { Category } from '../../types/api.types';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: categoryApi.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminCategories'] });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => categoryApi.create(data),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Lỗi tạo danh mục'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      categoryApi.update(id, data),
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Lỗi cập nhật'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openCreate = () => {
    setShowForm(true);
    setEditing(null);
    setForm({ name: '', description: '' });
    setError('');
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description ?? '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Tên danh mục không được để trống');
      return;
    }
    const payload = { name: form.name.trim(), description: form.description.trim() || undefined };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (category: Category) => {
    if (window.confirm(`Xóa danh mục "${category.name}"?`)) deleteMutation.mutate(category.id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-6 lg:px-8">
      <AdminNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold uppercase text-gray-800">Quản lý danh mục</h1>
          <p className="mt-1 text-gray-500">Tổ chức nhóm sản phẩm hiển thị ở bộ lọc trang chủ.</p>
        </div>
        {!showForm && (
          <button onClick={openCreate} className="rounded-full bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700">
            + Thêm danh mục
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-[8px] border border-red-100 bg-red-50 p-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Tên danh mục *</label>
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Tên danh mục"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">Mô tả</label>
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Mô tả tùy chọn"
            />
          </div>
          {error && <p className="md:col-span-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-red-600 px-5 py-2.5 font-bold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-full border border-gray-300 px-5 py-2.5 font-bold text-gray-700 hover:border-red-600 hover:text-red-600">
              Hủy
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-red-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!categories.length && (
                <tr><td colSpan={4} className="py-10 text-center text-gray-500">Chưa có danh mục nào</td></tr>
              )}
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-400">#{category.id}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{category.name}</td>
                  <td className="px-4 py-3 text-gray-600">{category.description ?? 'Không có mô tả'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(category)} className="rounded-full border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600">Sửa</button>
                      <button onClick={() => handleDelete(category)} className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-100">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
