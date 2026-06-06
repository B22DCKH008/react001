import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import { orderApi } from '../api/order';
import { apiAssetUrl } from '../api/axios';

function formatPrice(price: number) {
  return `${Number(price).toLocaleString('vi-VN')}đ`;
}

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
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders', { state: { checkoutSuccess: true } });
    },
  });

  const total = cart?.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  ) ?? 0;
  const totalQuantity = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  if (isLoading) {
    return <div className="py-16 text-center text-gray-500">Đang tải...</div>;
  }

  if (!cart?.items.length) {
    return (
      <div className="mx-auto max-w-[1700px] bg-white px-5 py-14 text-center lg:px-8">
        <div className="mx-auto max-w-xl rounded-[8px] border border-red-100 bg-red-50 p-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl text-red-600">
            &#128717;
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Giỏ hàng trống</h1>
          <p className="mb-6 text-gray-600">Hãy thêm sản phẩm yêu thích vào giỏ hàng.</p>
          <Link
            to="/"
            className="inline-flex rounded-full bg-red-600 px-7 py-3 font-bold text-white transition-colors hover:bg-red-700"
          >
            Xem sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold uppercase text-gray-800">Giỏ hàng</h1>
          <p className="mt-1 text-gray-500">{totalQuantity} sản phẩm trong giỏ của bạn</p>
        </div>
        <Link to="/" className="font-semibold text-red-600 hover:text-red-700">
          Tiếp tục mua hàng
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {cart.items.map((item) => {
            const productPrice = Number(item.product.price);
            const nextQuantity = Math.max(1, item.quantity - 1);

            return (
              <div key={item.id} className="grid gap-4 rounded-[8px] border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:grid-cols-[132px_minmax(0,1fr)_180px_150px_44px] md:items-center">
                <Link to={`/products/${item.product.id}`} className="overflow-hidden rounded-[8px] border border-gray-100 bg-gray-100">
                  {item.product.image_url ? (
                    <img
                      src={apiAssetUrl(item.product.image_url)}
                      alt={item.product.name}
                      className="aspect-square w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center text-sm text-gray-400">
                      Chưa có ảnh
                    </div>
                  )}
                </Link>

                <div className="min-w-0">
                  <Link to={`/products/${item.product.id}`} className="line-clamp-2 text-lg font-bold text-gray-950 hover:text-red-600">
                    {item.product.name}
                  </Link>
                  {item.product.category && (
                    <span className="mt-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                      {item.product.category.name}
                    </span>
                  )}
                  <p className="mt-3 text-base font-semibold text-gray-600">{formatPrice(productPrice)} / sản phẩm</p>
                </div>

                <div className="flex h-11 w-fit items-center rounded-full border border-gray-300">
                  <button
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: nextQuantity })}
                    disabled={updateMutation.isPending || item.quantity <= 1}
                    className="h-11 w-11 rounded-l-full text-xl font-bold text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={updateMutation.isPending}
                    className="h-11 w-11 rounded-r-full text-xl font-bold text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <p className="text-xl font-bold text-red-600">
                  {formatPrice(productPrice * item.quantity)}
                </p>

                <button
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 text-2xl leading-none text-gray-400 transition-colors hover:border-red-600 hover:text-red-600 disabled:opacity-40"
                  title="Xóa"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-[8px] border border-gray-200 bg-red-50 p-5 shadow-sm xl:sticky xl:top-5">
          <h2 className="mb-5 text-2xl font-bold text-gray-900">Tổng đơn hàng</h2>
          <div className="space-y-3 border-b border-red-100 pb-5 text-gray-700">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span className="font-semibold">{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Số lượng</span>
              <span className="font-semibold">{totalQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Vận chuyển</span>
              <span className="font-semibold text-red-600">Tính khi xác nhận</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xl font-bold">
            <span>Tổng cộng</span>
            <span className="text-2xl text-red-600">{formatPrice(total)}</span>
          </div>

          {checkoutMutation.isError && (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600">
              {(checkoutMutation.error as any)?.response?.data?.message || 'Đặt hàng thất bại'}
            </p>
          )}

          <button
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            className="mt-6 h-12 w-full rounded-full bg-red-600 font-bold uppercase text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {checkoutMutation.isPending ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </aside>
      </div>
    </div>
  );
}
