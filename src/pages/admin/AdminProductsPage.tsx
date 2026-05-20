import { useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const emptyForm: ProductAdminForm = { name: '', price: '', description: '', category_id: undefined };

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductAdminForm>(emptyForm);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminProducts', page],
    queryFn: () => productApi.getAll({ page, limit: 10 }),
  });

  const { data: categories } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: categoryApi.getAll,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminProducts'] });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => productApi.uploadImage(id, file),
    onSuccess: () => { invalidate(); setUploadingId(null); setError(''); },
    onError: (err: any) => {
      setUploadingId(null);
      setError(err.response?.data?.message || 'Khong the upload anh');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => productApi.create(data),
    onSuccess: () => { invalidate(); resetForm(); },
    onError: (err: any) => setError(err.response?.data?.message || 'Lá»—i táº¡o sáº£n pháº©m'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductFormData> }) => productApi.update(id, data),
    onSuccess: () => { invalidate(); resetForm(); },
    onError: (err: any) => setError(err.response?.data?.message || 'Lá»—i cáº­p nháº­t'),
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

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, price: String(p.price), description: p.description ?? '', category_id: p.category?.id });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('TÃªn sáº£n pháº©m khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng'); return; }
    const price = Number(form.price);
    if (!form.price.trim() || Number.isNaN(price) || price <= 0) { setError('GiÃ¡ pháº£i lá»›n hÆ¡n 0'); return; }
    const data: ProductFormData = {
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      category_id: form.category_id || undefined,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const handleDelete = (p: Product) => {
    if (window.confirm(`XoÃ¡ sáº£n pháº©m "${p.name}"?`)) deleteMutation.mutate(p.id);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Quáº£n lÃ½ sáº£n pháº©m</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setError(''); }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + ThÃªm sáº£n pháº©m
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">TÃªn sáº£n pháº©m *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="TÃªn sáº£n pháº©m"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">GiÃ¡ (â‚«) *</label>
            <input type="text" inputMode="decimal" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, '') })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">MÃ´ táº£</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="MÃ´ táº£ sáº£n pháº©m"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Danh má»¥c</label>
            <select value={form.category_id ?? ''}
              onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">â€” KhÃ´ng cÃ³ â€”</option>
              {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="sm:col-span-2 text-red-500 text-sm">{error}</p>}
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={isPending}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {isPending ? 'Äang lÆ°u...' : editing ? 'Cáº­p nháº­t' : 'Táº¡o má»›i'}
            </button>
            <button type="button" onClick={resetForm}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Huá»·
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Äang táº£i...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 text-left w-14">áº¢nh</th>
                  <th className="px-4 py-3 text-left w-12">ID</th>
                  <th className="px-4 py-3 text-left">TÃªn</th>
                  <th className="px-4 py-3 text-left">GiÃ¡</th>
                  <th className="px-4 py-3 text-left">Danh má»¥c</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!data?.data.length && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">ChÆ°a cÃ³ sáº£n pháº©m</td></tr>
                )}
                {data?.data.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      {p.image_url ? (
                        <img src={apiAssetUrl(p.image_url)} alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">â€”</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">{Number(p.price).toLocaleString('vi-VN')} â‚«</td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name ?? 'â€”'}</td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Sá»­a</button>
                      <button
                        onClick={() => { setUploadingId(p.id); fileInputRef.current?.click(); }}
                        disabled={uploadMutation.isPending && uploadingId === p.id}
                        className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-40"
                      >
                        {uploadMutation.isPending && uploadingId === p.id ? '...' : 'áº¢nh'}
                      </button>
                      <button onClick={() => handleDelete(p)} className="text-red-500 hover:text-red-700 text-xs font-medium">XoÃ¡</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">TrÆ°á»›c</button>
              <span className="text-sm text-gray-600">Trang {data.page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50">Sau</button>
            </div>
          )}
        </>
      )}

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingId !== null) uploadMutation.mutate({ id: uploadingId, file });
          e.target.value = '';
        }}
      />
    </div>
  );
}
