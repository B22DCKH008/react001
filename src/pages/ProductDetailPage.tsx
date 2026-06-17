import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productApi } from "../api/product";
import { cartApi } from "../api/cart";
import { apiAssetUrl } from "../api/axios";

type ApiError = {
  response?: {
    status?: number;
    data?: { message?: string | string[] };
  };
};

function formatPrice(price: number) {
  return `${Number(price).toLocaleString("vi-VN")}đ`;
}

function getErrorMessage(error: unknown, fallback: string) {
  const message = (error as ApiError).response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const productId = Number(id);
  const [quantity, setQuantity] = useState(1);

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productApi.getById(productId),
    enabled: Number.isFinite(productId) && productId > 0,
  });

  const addMutation = useMutation({
    mutationFn: () => {
      const safeQuantity =
        product && product.stock > 0 ? Math.min(quantity, product.stock) : quantity;
      return cartApi.addItem(productId, safeQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      navigate("/cart");
    },
    onError: (err: unknown) => {
      if ((err as ApiError).response?.status === 401) navigate("/login");
    },
  });

  if (!Number.isFinite(productId) || productId <= 0 || isError) {
    return (
      <div className="mx-auto max-w-[1700px] bg-white px-5 py-16 text-center lg:px-8">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">
          Không tìm thấy sản phẩm
        </h1>
        <Link to="/" className="font-semibold text-red-600 hover:text-red-700">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (isLoading || !product) {
    return <div className="py-16 text-center text-gray-500">Đang tải...</div>;
  }

  const isOutOfStock = product.stock <= 0;
  const selectedQuantity = isOutOfStock ? 1 : Math.min(quantity, product.stock);

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-8 lg:px-8">
      <Link
        to="/"
        className="mb-5 inline-flex items-center font-semibold text-red-600 hover:text-red-700"
      >
        ← Quay lại sản phẩm
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)]">
        <div className="overflow-hidden rounded-[8px] border border-gray-200 bg-gray-100 shadow-sm">
          {product.image_url ? (
            <img
              src={apiAssetUrl(product.image_url)}
              alt={product.name}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center text-gray-400">
              Chưa có ảnh
            </div>
          )}
        </div>

        <div className="rounded-[8px] border border-gray-200 bg-white p-6 shadow-sm">
          {product.category && (
            <span className="mb-4 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
              {product.category.name}
            </span>
          )}

          <h1 className="text-3xl font-bold leading-tight text-gray-950">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-amber-400">★★★★★</span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
              Đã bán {Math.max(5, product.id * 3)}
            </span>
          </div>

          <p className="mt-5 text-4xl font-bold text-red-600">
            {formatPrice(product.price)}
          </p>
          <p
            className={`mt-3 text-sm font-bold ${isOutOfStock ? "text-red-600" : "text-emerald-700"}`}
          >
            {isOutOfStock ? "Hết hàng" : `Còn ${product.stock} sản phẩm`}
          </p>

          <div className="mt-6 rounded-[8px] bg-gray-50 p-5">
            <h2 className="mb-3 text-lg font-bold text-gray-900">
              Mô tả sản phẩm
            </h2>
            <p className="leading-7 text-gray-600 whitespace-pre-line">
              {product.description || "Sản phẩm hiện chưa có mô tả chi tiết."}
            </p>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <label className="mb-3 block text-lg font-bold text-gray-900">
              Số lượng
            </label>
            <div className="mb-6 flex h-12 w-fit items-center rounded-full border border-gray-300">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, selectedQuantity - 1))}
                disabled={isOutOfStock || selectedQuantity <= 1}
                className="h-12 w-12 rounded-l-full text-xl font-bold text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={Math.max(1, product.stock)}
                value={selectedQuantity}
                disabled={isOutOfStock}
                onChange={(event) => {
                  const nextValue = Math.max(
                    1,
                    Number(event.target.value) || 1,
                  );
                  setQuantity(Math.min(product.stock, nextValue));
                }}
                className="h-12 w-16 border-0 bg-transparent text-center text-lg font-bold outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setQuantity(Math.min(product.stock, selectedQuantity + 1))
                }
                disabled={isOutOfStock || selectedQuantity >= product.stock}
                className="h-12 w-12 rounded-r-full text-xl font-bold text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              >
                +
              </button>
            </div>

            {addMutation.isError &&
              (addMutation.error as ApiError)?.response?.status !== 401 && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
                  {getErrorMessage(
                    addMutation.error,
                    "Không thể thêm vào giỏ hàng",
                  )}
                </p>
              )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending || isOutOfStock}
                className="h-13 rounded-full bg-red-600 px-6 py-3 font-bold uppercase text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {isOutOfStock
                  ? "Hết hàng"
                  : addMutation.isPending
                    ? "Đang thêm..."
                    : "Thêm vào giỏ hàng"}
              </button>
              <button
                type="button"
                onClick={() => {
                  addMutation.mutate(undefined, {
                    onSuccess: () => navigate("/cart"),
                  });
                }}
                disabled={addMutation.isPending || isOutOfStock}
                className="h-13 rounded-full border border-red-600 px-6 py-3 font-bold uppercase text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
