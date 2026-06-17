import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../../api/product";
import type { ProductFormData } from "../../api/product";
import { apiAssetUrl } from "../../api/axios";
import { categoryApi } from "../../api/category";
import type { Product } from "../../types/api.types";
import AdminNav from "../../components/admin/AdminNav";

type ProductAdminForm = {
  name: string;
  price: string;
  stock: string;
  description: string;
  category_id?: number;
  imageFile: File | null;
};

const emptyForm: ProductAdminForm = {
  name: "",
  price: "",
  stock: "0",
  description: "",
  category_id: undefined,
  imageFile: null,
};

const PRODUCT_PRICE_MAX = 2_147_483_647;
const PRODUCT_STOCK_MAX = 1_000_000_000;

function formatPrice(value: number) {
  return `${Number(value).toLocaleString("vi-VN")}đ`;
}

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) return message.join(", ");
  return message || fallback;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const previewUrlRef = useRef("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductAdminForm>(emptyForm);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adminProducts", page],
    queryFn: () => productApi.getAll({ page, limit: 10 }),
  });

  const { data: categories } = useQuery({
    queryKey: ["adminCategories"],
    queryFn: categoryApi.getAll,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["adminProducts"] });

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const clearImagePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setImagePreviewUrl("");
  };

  const handleImageFileChange = (file: File | null) => {
    setForm((current) => ({ ...current, imageFile: file }));
    clearImagePreview();

    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setImagePreviewUrl(previewUrl);
  };

  const createMutation = useMutation({
    mutationFn: async ({
      data,
      imageFile,
    }: {
      data: ProductFormData;
      imageFile: File | null;
    }) => {
      const product = await productApi.create(data);
      return imageFile
        ? productApi.uploadImage(product.id, imageFile)
        : product;
    },
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: unknown) =>
      setError(getErrorMessage(err, "Lỗi tạo sản phẩm")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
      imageFile,
    }: {
      id: number;
      data: Partial<ProductFormData>;
      imageFile: File | null;
    }) => {
      const product = await productApi.update(id, data);
      return imageFile ? productApi.uploadImage(id, imageFile) : product;
    },
    onSuccess: () => {
      invalidate();
      resetForm();
    },
    onError: (err: unknown) => setError(getErrorMessage(err, "Lỗi cập nhật")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: invalidate,
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(false);
    setError("");
    clearImagePreview();
  };

  const openCreate = () => {
    setShowForm(true);
    setEditing(null);
    setForm(emptyForm);
    setError("");
    clearImagePreview();
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      price: String(product.price),
      stock: String(product.stock ?? 0),
      description: product.description ?? "",
      category_id: product.category?.id,
      imageFile: null,
    });
    setShowForm(true);
    setError("");
    clearImagePreview();
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Tên sản phẩm không được để trống");
      return;
    }
    if (form.name.trim().length > 255) {
      setError("Tên sản phẩm không được vượt quá 255 ký tự");
      return;
    }
    const priceText = form.price.trim();
    if (!priceText || !/^\d+$/.test(priceText)) {
      setError("Giá phải lớn hơn 0");
      return;
    }

    const price = Number(priceText);
    if (!Number.isSafeInteger(price) || price <= 0) {
      setError("Giá phải là số nguyên hợp lệ");
      return;
    }
    if (price > PRODUCT_PRICE_MAX) {
      setError(`Giá không được lớn hơn ${formatPrice(PRODUCT_PRICE_MAX)}`);
      return;
    }

    const stockText = form.stock.trim();
    if (!stockText || !/^\d+$/.test(stockText)) {
      setError("Tồn kho phải là số nguyên không âm");
      return;
    }
    const stock = Number(stockText);
    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError("Tồn kho phải là số nguyên không âm");
      return;
    }
    if (stock > PRODUCT_STOCK_MAX) {
      setError("Tồn kho không được lớn hơn 1.000.000.000");
      return;
    }

    const payload: ProductFormData = {
      name: form.name.trim(),
      price,
      stock,
      description: form.description.trim(),
      category_id: form.category_id || undefined,
    };

    if (editing)
      updateMutation.mutate({
        id: editing.id,
        data: payload,
        imageFile: form.imageFile,
      });
    else createMutation.mutate({ data: payload, imageFile: form.imageFile });
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Xóa sản phẩm "${product.name}"?`))
      deleteMutation.mutate(product.id);
  };

  const products = data?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;
  const imagePreviewSrc =
    imagePreviewUrl ||
    (editing?.image_url ? apiAssetUrl(editing.image_url) : "");

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 py-6 lg:px-8">
      <AdminNav />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold uppercase text-gray-800">
            Quản lý sản phẩm
          </h1>
          <p className="mt-1 text-gray-500">
            Thêm, sửa, xóa và cập nhật hình ảnh sản phẩm.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-full bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-700"
          >
            + Thêm sản phẩm
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-4 rounded-[8px] border border-red-100 bg-red-50 p-5 md:grid-cols-2"
        >
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Tên sản phẩm *
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              maxLength={255}
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Tên sản phẩm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Giá *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.price}
              onChange={(event) =>
                setForm({
                  ...form,
                  price: event.target.value.replace(/\D/g, ""),
                })
              }
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Tồn kho *
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.stock}
              onChange={(event) =>
                setForm({
                  ...form,
                  stock: event.target.value.replace(/\D/g, ""),
                })
              }
              className="w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Danh mục
            </label>
            <select
              value={form.category_id ?? ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  category_id: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
              className="w-full rounded-[8px] border border-gray-300 bg-white px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="">Không có</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Ảnh sản phẩm
            </label>
            <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] border border-gray-300 bg-white px-3 py-2 outline-none transition-colors hover:border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100">
              <span className="truncate text-gray-700">
                {form.imageFile?.name ??
                  (editing?.image_url
                    ? "Giữ ảnh hiện tại"
                    : "Chọn ảnh sản phẩm")}
              </span>
              <span className="shrink-0 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                Chọn ảnh
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  handleImageFileChange(file);
                  event.target.value = "";
                }}
              />
            </label>
            {imagePreviewSrc && (
              <div className="mt-2 flex items-center gap-3 rounded-[8px] border border-gray-200 bg-white px-3 py-2">
                <img
                  src={imagePreviewSrc}
                  alt="Ảnh sản phẩm"
                  className="h-12 w-12 rounded-[8px] object-cover"
                />
                <span className="truncate text-sm font-semibold text-gray-600">
                  {form.imageFile ? "Ảnh mới" : "Ảnh hiện tại"}
                </span>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              Mô tả
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              className="min-h-24 w-full rounded-[8px] border border-gray-300 px-3 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Mô tả sản phẩm"
            />
          </div>
          {error && (
            <p className="md:col-span-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-red-600 px-5 py-2.5 font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mới"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-full border border-gray-300 px-5 py-2.5 font-bold text-gray-700 transition-colors hover:border-red-600 hover:text-red-600"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải...</div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[8px] border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-red-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Ảnh</th>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Tên</th>
                  <th className="px-4 py-3 text-left">Giá</th>
                  <th className="px-4 py-3 text-left">Tồn kho</th>
                  <th className="px-4 py-3 text-left">Danh mục</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!products.length && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-500">
                      Chưa có sản phẩm
                    </td>
                  </tr>
                )}
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {product.image_url ? (
                        <img
                          src={apiAssetUrl(product.image_url)}
                          alt={product.name}
                          className="h-14 w-14 rounded-[8px] object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-gray-100 text-xs text-gray-400">
                          Ảnh
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-400">
                      #{product.id}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      {product.stock > 0 ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                          Còn {product.stock}
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                          Hết hàng
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.category?.name ?? "Không có"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="rounded-full border border-gray-300 px-3 py-1.5 font-semibold text-gray-700 hover:border-red-600 hover:text-red-600"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="rounded-full bg-red-50 px-3 py-1.5 font-semibold text-red-600 hover:bg-red-100"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <span className="text-sm text-gray-600">
                Trang {data.page} / {data.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((current) => Math.min(data.totalPages, current + 1))
                }
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
