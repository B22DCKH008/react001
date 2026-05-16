import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/user';
import type { User } from '../../types/api.types';
import AdminNav from '../../components/admin/AdminNav';
import { useAuth } from '../../store/AuthContext';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: userApi.getAll,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['adminUsers'] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: 'user' | 'admin' }) => userApi.updateRole(id, role),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: invalidate,
  });

  const handleDelete = (u: User) => {
    if (window.confirm(`Xoá user "${u.name}" (${u.email})?`)) deleteMutation.mutate(u.id);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <AdminNav />
      <h1 className="text-xl font-bold text-gray-800 mb-4">Quản lý người dùng</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left w-12">ID</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!users?.length && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Chưa có người dùng</td></tr>
              )}
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{u.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {u.name}
                    {u.id === currentUser?.id && (
                      <span className="ml-1 text-xs text-gray-400">(bạn)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3">
                    {u.id !== currentUser?.id && (
                      <>
                        <button
                          onClick={() => roleMutation.mutate({ id: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                          disabled={roleMutation.isPending}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-40"
                        >
                          {u.role === 'admin' ? '→ User' : '→ Admin'}
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deleteMutation.isPending}
                          className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-40"
                        >
                          Xoá
                        </button>
                      </>
                    )}
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
