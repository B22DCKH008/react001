import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../../api/order';
import type { OrderStatus } from '../../types/api.types';
import AdminNav from '../../components/admin/AdminNav';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã huỷ',
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const [statusMap, setStatusMap] = useState<Record<number, OrderStatus>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['adminOrders', page],
    queryFn: () => orderApi.getAllAdmin(page, 10),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      orderApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminOrders'] }),
  });

  const getSelectedStatus = (orderId: number, current: OrderStatus): OrderStatus =>
    statusMap[orderId] ?? current;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <AdminNav />
      <h1 className="text-xl font-bold text-gray-800 mb-4">Quản lý đơn hàng</h1>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Đang tải...</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left w-12">ID</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Ngày đặt</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Đổi trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!data?.data.length && (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Chưa có đơn hàng</td></tr>
                )}
                {data?.data.map((order) => {
                  const selected = getSelectedStatus(order.id, order.status);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-400">#{order.id}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{order.user?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{order.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">
                        {Number(order.total_amount).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selected}
                            onChange={(e) => setStatusMap({ ...statusMap, [order.id]: e.target.value as OrderStatus })}
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="cancelled">Đã huỷ</option>
                          </select>
                          <button
                            onClick={() => updateMutation.mutate({ id: order.id, status: selected })}
                            disabled={updateMutation.isPending || selected === order.status}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Lưu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">Trang {data.page} / {data.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
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
