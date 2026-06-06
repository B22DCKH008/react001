import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/user';
import type { User } from '../../types/api.types';
import AdminNav from '../../components/admin/AdminNav';
import { useAuth } from '../../store/AuthContext';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({
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

  const handleDelete = (user: User) => {
    if (window.confirm(`Xóa người dùng "${user.name}" (${user.email})?`)) deleteMutation.mutate(user.id);
  };

  const adminCount = users.filter((user) => user.role === 'admin').length;

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-6 lg:px-8">
      <AdminNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold uppercase text-gray-800">Quản lý người dùng</h1>
          <p className="mt-1 text-gray-500">Quản lý tài khoản, quyền user và admin.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[8px] bg-red-50 px-4 py-3">
            <p className="text-gray-500">Tổng người dùng</p>
            <p className="text-2xl font-bold text-red-600">{users.length}</p>
          </div>
          <div className="rounded-[8px] bg-gray-50 px-4 py-3">
            <p className="text-gray-500">Admin</p>
            <p className="text-2xl font-bold text-gray-800">{adminCount}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-[8px] border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-red-50 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Tên</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Vai trò</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!users.length && (
                <tr><td colSpan={5} className="py-10 text-center text-gray-500">Chưa có người dùng</td></tr>
              )}
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-400">#{user.id}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">Bạn</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.id !== currentUser?.id && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => roleMutation.mutate({ id: user.id, role: user.role === 'admin' ? 'user' : 'admin' })}
                          disabled={roleMutation.isPending}
                          className="rounded-full border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600 disabled:opacity-50"
                        >
                          {user.role === 'admin' ? 'Đổi thành User' : 'Đổi thành Admin'}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deleteMutation.isPending}
                          className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          Xóa
                        </button>
                      </div>
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
