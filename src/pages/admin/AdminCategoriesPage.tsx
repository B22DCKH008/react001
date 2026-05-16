import { useState } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../../api/category';
import type { Category } from '../../types/api.types';
import AdminNav from '../../components/admin/AdminNav';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: categoryApi.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminCategories'] });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => categoryApi.create(data),
    onSuccess: () => { invalidate(); resetForm(); },
    onError: (err: any) => setError(err.response?.data?.message || 'Lỗi tạo danh mục'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name?: string; description?: string } }) =>
      categoryApi.update(id, data),
    onSuccess: () => { invalidate(); resetForm(); },
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

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '' });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Tên danh mục không được để trống'); return; }
    const data = { name: form.name.trim(), description: form.description.trim() || undefined };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const handleDelete = (cat: Category) => {
    if (window.confirm(`Xoá danh mục "${cat.name}"?`)) deleteMutation.mutate(cat.id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Quản lý danh mục</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '' }); setError(''); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Thêm danh mục
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tên danh mục *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tên danh mục"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả (tuỳ chọn)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          {error && <p className="w-full text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={isPending}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {isPending ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Tạo mới'}
          </button>
          <button type="button" onClick={resetForm}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Huỷ
          </button>
        </form>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left w-12">ID</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!categories?.length && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Chưa có danh mục nào</td></tr>
              )}
              {categories?.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{cat.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.description ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <button onClick={() => openEdit(cat)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Sửa</button>
                    <button onClick={() => handleDelete(cat)} className="text-red-500 hover:text-red-700 text-xs font-medium">Xoá</button>
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
