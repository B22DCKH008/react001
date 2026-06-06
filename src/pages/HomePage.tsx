import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productApi } from '../api/product';
import { categoryApi } from '../api/category';
import { apiAssetUrl } from '../api/axios';
import type { Product } from '../types/api.types';

type SortKey = 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc';

const PRODUCTS_PER_PAGE = 8;

const priceRanges = [
  { id: 'under500', label: 'Dưới 500k', min: 0, max: 499_999 },
  { id: '500to1m', label: '500k - 1 triệu', min: 500_000, max: 1_000_000 },
  { id: '1to5m', label: '1 triệu - 5 triệu', min: 1_000_000, max: 5_000_000 },
  { id: '5to10m', label: '5 triệu - 10 triệu', min: 5_000_000, max: 10_000_000 },
  { id: '10to50m', label: '10 triệu - 50 triệu', min: 10_000_000, max: 50_000_000 },
  { id: 'over50', label: 'Trên 50 triệu', min: 50_000_001, max: Number.POSITIVE_INFINITY },
];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'nameAsc', label: 'Tên A -> Z' },
  { key: 'nameDesc', label: 'Tên Z -> A' },
  { key: 'priceAsc', label: 'Giá tăng dần' },
  { key: 'priceDesc', label: 'Giá giảm dần' },
];

function formatPrice(price: number) {
  return `${Number(price).toLocaleString('vi-VN')}đ`;
}

function isProductInPriceRanges(product: Product, selectedRangeIds: string[]) {
  if (!selectedRangeIds.length) return true;
  const price = Number(product.price);
  return selectedRangeIds.some((rangeId) => {
    const range = priceRanges.find((item) => item.id === rangeId);
    return range ? price >= range.min && price <= range.max : false;
  });
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get('q')?.trim() ?? '';
  const [page, setPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedPriceRangeIds, setSelectedPriceRangeIds] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('priceDesc');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['homeProducts', searchKeyword],
    queryFn: () => productApi.getAll({ page: 1, limit: 100, name: searchKeyword || undefined }),
    staleTime: 30_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['homeCategories'],
    queryFn: categoryApi.getAll,
  });

  useEffect(() => {
    setPage(1);
  }, [searchKeyword, selectedCategoryIds, selectedPriceRangeIds, sort]);

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);

  const filteredProducts = useMemo(() => {
    const products = data?.data ?? [];
    return products
      .filter((product) => {
        if (!selectedCategoryIds.length) return true;
        return product.category?.id ? selectedCategoryIds.includes(product.category.id) : false;
      })
      .filter((product) => isProductInPriceRanges(product, selectedPriceRangeIds))
      .sort((a, b) => {
        if (sort === 'nameAsc') return a.name.localeCompare(b.name, 'vi');
        if (sort === 'nameDesc') return b.name.localeCompare(a.name, 'vi');
        if (sort === 'priceAsc') return Number(a.price) - Number(b.price);
        return Number(b.price) - Number(a.price);
      });
  }, [data?.data, selectedCategoryIds, selectedPriceRangeIds, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  };

  const togglePriceRange = (rangeId: string) => {
    setSelectedPriceRangeIds((current) =>
      current.includes(rangeId) ? current.filter((id) => id !== rangeId) : [...current, rangeId],
    );
  };

  return (
    <div className="mx-auto max-w-[1700px] bg-white px-5 pb-10 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r border-gray-200 py-4 pr-5">
          <section className="border-b border-gray-200 pb-6">
            <h2 className="mb-4 text-xl font-medium uppercase text-red-600">Loại sản phẩm</h2>
            <div className="space-y-3">
              {visibleCategories.map((category) => (
                <label key={category.id} className="flex cursor-pointer items-start gap-3 text-lg leading-snug text-gray-950">
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="mt-1 h-6 w-6 shrink-0 appearance-none rounded border border-gray-900 bg-white checked:border-red-600 checked:bg-red-600"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
            {categories.length > 5 && (
              <button
                onClick={() => setShowAllCategories((value) => !value)}
                className="mt-4 flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-red-700"
              >
                {showAllCategories ? 'Thu gọn' : 'Xem thêm'}
                <span className="text-base leading-none">{showAllCategories ? '^' : '⌄'}</span>
              </button>
            )}
          </section>

          <section className="pt-5">
            <h2 className="mb-4 text-xl font-medium uppercase text-red-600">Mức giá</h2>
            <div className="space-y-3">
              {priceRanges.map((range) => (
                <label key={range.id} className="flex cursor-pointer items-center gap-3 text-lg text-gray-950">
                  <input
                    type="checkbox"
                    checked={selectedPriceRangeIds.includes(range.id)}
                    onChange={() => togglePriceRange(range.id)}
                    className="h-6 w-6 shrink-0 appearance-none rounded border border-gray-900 bg-white checked:border-red-600 checked:bg-red-600"
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </div>
          </section>
        </aside>

        <section className="min-w-0 py-3">
          <h1 className="mb-6 text-3xl font-bold uppercase text-gray-700">SHOP BÌNH - DỤNG CỤ HỌC TẬP</h1>

          <div className="mb-4 flex flex-wrap items-center gap-5 border-b border-gray-200 pb-3 text-lg">
            <span className="text-gray-950">Sắp xếp:</span>
            {sortOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setSort(option.key)}
                className={`border-b-2 pb-2 transition-colors ${
                  sort === option.key
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-red-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-gray-500">Đang tải...</div>
          ) : isError ? (
            <div className="py-16 text-center text-red-600">
              Không thể tải sản phẩm. Vui lòng kiểm tra backend tại http://localhost:3000.
            </div>
          ) : !paginatedProducts.length ? (
            <div className="py-16 text-center text-gray-500">Không có sản phẩm nào</div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {paginatedProducts.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group flex min-h-[560px] flex-col overflow-hidden rounded-[8px] border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {product.image_url ? (
                      <img
                        src={apiAssetUrl(product.image_url)}
                        alt={product.name}
                        className="aspect-square w-full bg-gray-100 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-gray-100 text-gray-400">
                        Chưa có ảnh
                      </div>
                    )}

                    <div className="flex flex-1 flex-col px-4 py-4">
                      <span className="mb-4 w-fit rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
                        Đã bán {Math.max(5, product.id * 3)}
                      </span>
                      <h3 className="line-clamp-2 min-h-[56px] text-lg font-semibold leading-7 text-gray-950">
                        {product.name}
                      </h3>
                      <div className="mt-4 flex items-center justify-center gap-2 text-lg text-amber-400">
                        <span>★★★★★</span>
                        <span className="text-sm text-amber-500">({product.id % 11})</span>
                      </div>
                      <p className="mt-2 text-center text-2xl font-bold text-red-600">{formatPrice(product.price)}</p>
                      <button
                        type="button"
                        className="mt-auto rounded-full border border-red-600 px-5 py-2 text-sm font-bold uppercase text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white"
                      >
                        Xem nhanh
                      </button>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Trước
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={`h-10 w-10 rounded-lg font-bold transition-colors ${
                        pageNumber === page
                          ? 'bg-red-600 text-white'
                          : 'border border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
