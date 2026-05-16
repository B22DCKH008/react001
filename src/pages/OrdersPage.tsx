import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '../api/order';
import type { OrderStatus } from '../types/api.types';

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

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => orderApi.getAll(page, 10),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) => orderApi.cancel(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', page] }),
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Đơn hàng của tôi</h1>

      {isLoading ? (
        <div className="text-center py-16 text-gray-500">Đang tải...</div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500">Không thể tải đơn hàng</div>
      ) : !data?.data.length ? (
        <div className="text-center py-16 text-gray-500">Bạn chưa có đơn hàng nào</div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {data.data.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">Đơn hàng #{order.id}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLASS[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>{Number(item.subtotal).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="font-semibold text-gray-800">
                    Tổng: <span className="text-blue-600">{Number(order.total_amount).toLocaleString('vi-VN')} ₫</span>
                  </p>
                  {order.status === 'pending' && (
                    <button
                      onClick={() => cancelMutation.mutate(order.id)}
                      disabled={cancelMutation.isPending && cancelMutation.variables === order.id}
                      className="text-sm text-red-500 hover:text-red-700 border border-red-300 hover:border-red-500 px-3 py-1 rounded-lg disabled:opacity-40 transition-colors"
                    >
                      Huỷ đơn
                    </button>
                  )}
                </div>
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
