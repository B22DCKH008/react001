import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import { orderApi } from '../api/order';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      cartApi.updateItem(itemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => cartApi.removeItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const checkoutMutation = useMutation({
    mutationFn: orderApi.checkout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/orders');
    },
  });

  const total = cart?.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  ) ?? 0;

  if (isLoading) {
    return <div className="text-center py-16 text-gray-500">Đang tải...</div>;
  }

  if (!cart?.items.length) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-6">Hãy thêm sản phẩm vào giỏ hàng</p>
        <Link
          to="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 space-y-3">
          {cart.items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
              <div className="bg-gray-100 rounded-lg w-16 h-16 flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                Ảnh
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{item.product.name}</p>
                <p className="text-sm text-gray-500">
                  {Number(item.product.price).toLocaleString('vi-VN')} ₫ / cái
                </p>
              </div>
              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                  disabled={updateMutation.isPending}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                  disabled={updateMutation.isPending}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  +
                </button>
              </div>
              {/* Subtotal */}
              <p className="w-28 text-right text-sm font-semibold text-blue-600">
                {(Number(item.product.price) * item.quantity).toLocaleString('vi-VN')} ₫
              </p>
              {/* Remove */}
              <button
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
                className="text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors text-lg leading-none"
                title="Xoá"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:w-64">
          <div className="bg-white rounded-xl shadow-sm p-5 sticky top-4">
            <h2 className="font-semibold text-gray-800 mb-4">Tổng đơn hàng</h2>
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Tạm tính ({cart.items.length} sản phẩm)</span>
            </div>
            <div className="flex justify-between font-bold text-gray-800 text-lg mb-5">
              <span>Tổng cộng</span>
              <span className="text-blue-600">{total.toLocaleString('vi-VN')} ₫</span>
            </div>
            {checkoutMutation.isError && (
              <p className="text-red-500 text-xs mb-3">
                {(checkoutMutation.error as any)?.response?.data?.message || 'Đặt hàng thất bại'}
              </p>
            )}
            <button
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {checkoutMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
