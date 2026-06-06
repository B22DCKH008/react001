import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function formatPrice(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}đ`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

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

  const orders = data?.data ?? [];
  const pendingCount = orders.filter((order) => order.status === 'pending').length;

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-6 lg:px-8">
      <AdminNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold uppercase text-gray-800">Quản lý đơn hàng</h1>
          <p className="mt-1 text-gray-500">Theo dõi trạng thái và chi tiết sản phẩm trong từng đơn.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-[8px] bg-red-50 px-4 py-3">
            <p className="text-gray-500">Tổng đơn trang này</p>
            <p className="text-2xl font-bold text-red-600">{orders.length}</p>
          </div>
          <div className="rounded-[8px] bg-yellow-50 px-4 py-3">
            <p className="text-gray-500">Chờ xác nhận</p>
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[8px] border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-red-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Đơn</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Sản phẩm trong đơn</th>
                  <th className="px-4 py-3 text-left">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Ngày đặt</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Cập nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!orders.length && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">Chưa có đơn hàng</td>
                  </tr>
                )}

                {orders.map((order) => {
                  const selected = statusMap[order.id] ?? order.status;
                  return (
                    <tr key={order.id} className="align-top transition-colors hover:bg-gray-50">
                      <td className="px-4 py-4 font-bold text-gray-500">#{order.id}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-gray-900">{order.user?.name ?? 'Không rõ'}</p>
                        <p className="mt-1 text-xs text-gray-500">{order.user?.email ?? 'Chưa có email'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {!order.items?.length && <p className="text-gray-400">Không có dữ liệu sản phẩm</p>}
                          {order.items?.map((item) => (
                            <div key={item.id} className="rounded-[8px] bg-gray-50 px-3 py-2">
                              <div className="flex items-start justify-between gap-3">
                                <p className="font-semibold text-gray-800">{item.product_name}</p>
                                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                                  x{item.quantity}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                {formatPrice(item.product_price)} / sản phẩm · Thành tiền {formatPrice(item.subtotal)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-lg font-bold text-red-600">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-4 py-4 text-gray-500">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASS[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selected}
                            onChange={(event) =>
                              setStatusMap({ ...statusMap, [order.id]: event.target.value as OrderStatus })
                            }
                            className="rounded-[8px] border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          >
                            <option value="pending">Chờ xác nhận</option>
                            <option value="confirmed">Đã xác nhận</option>
                            <option value="cancelled">Đã huỷ</option>
                          </select>
                          <button
                            onClick={() => updateMutation.mutate({ id: order.id, status: selected })}
                            disabled={updateMutation.isPending || selected === order.status}
                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
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
    </div>
  );
}
