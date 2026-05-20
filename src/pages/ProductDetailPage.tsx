import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { productApi } from '../api/product';
import { cartApi } from '../api/cart';
import { apiAssetUrl } from '../api/axios';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productId = Number(id);
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productApi.getById(productId),
    enabled: Number.isFinite(productId) && productId > 0,
  });

  const addMutation = useMutation({
    mutationFn: () => cartApi.addItem(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/cart');
    },
    onError: (err: any) => {
      if (err.response?.status === 401) navigate('/login');
    },
  });

  if (!Number.isFinite(productId) || productId <= 0 || isError) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-3">Không tìm thấy sản phẩm</h1>
        <Link to="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (isLoading || !product) {
    return <div className="text-center py-16 text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
        Quay lại sản phẩm
      </Link>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {product.image_url ? (
            <img
              src={apiAssetUrl(product.image_url)}
              alt={product.name}
              className="w-full aspect-[4/3] object-cover bg-gray-100"
            />
          ) : (
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400">
              Chưa có ảnh
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
          {product.category && (
            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full mb-3">
              {product.category.name}
            </span>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
          <p className="text-2xl font-bold text-blue-600 mb-5">
            {Number(product.price).toLocaleString('vi-VN')} đ
          </p>
          <p className="text-gray-600 leading-7 mb-6 whitespace-pre-line">{product.description}</p>

          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
            <div className="flex items-center gap-3 mb-5">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="w-20 h-10 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50"
              >
                +
              </button>
            </div>

            {addMutation.isError && (addMutation.error as any)?.response?.status !== 401 && (
              <p className="text-sm text-red-500 mb-3">
                {(addMutation.error as any)?.response?.data?.message || 'Không thể thêm vào giỏ hàng'}
              </p>
            )}
            <button
              type="button"
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {addMutation.isPending ? 'Đang thêm...' : 'Thêm vào giỏ hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
