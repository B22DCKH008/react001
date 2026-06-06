import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cartApi } from '../../api/cart';
import { useAuth } from '../../store/AuthContext';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    enabled: isLoggedIn,
  });
  const cartCount = cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const keyword = search.trim();
    navigate(keyword ? `/?q=${encodeURIComponent(keyword)}` : '/');
  };

  return (
    <header className="bg-red-700 text-white">
      <div className="mx-auto flex max-w-[1700px] items-center gap-6 px-6 py-4 lg:px-10">
        <Link to="/" className="shrink-0 text-3xl font-black italic tracking-wide">
          SHOP BÌNH
        </Link>

        <form onSubmit={handleSearch} className="flex min-w-[260px] flex-1 overflow-hidden rounded-xl bg-white">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="h-12 min-w-0 flex-1 px-4 text-lg text-gray-700 outline-none"
          />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="flex h-12 w-14 items-center justify-center bg-red-950 text-2xl text-white transition-colors hover:bg-red-900"
          >
            &#128269;
          </button>
        </form>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-950 text-xl">&#9742;</div>
          <div className="leading-tight">
            <div className="text-xl font-bold">1900 866 819</div>
            <div className="text-sm">Hỗ trợ khách hàng</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="hidden rounded-full bg-red-950 px-4 py-2 font-semibold hover:bg-red-900 sm:block">
                {user?.name}
              </Link>
              <button onClick={handleLogout} className="rounded-full bg-white px-4 py-2 font-semibold text-red-700 hover:bg-red-50">
                Đăng xuất
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="font-bold hover:text-red-100">Đăng nhập</Link>
              <Link to="/register" className="text-sm font-semibold hover:text-red-100">Đăng ký</Link>
            </div>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-full bg-white px-4 py-2 font-semibold text-red-700 transition-colors hover:bg-red-50"
            >
              Quản trị
            </Link>
          )}

          <Link to="/cart" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-red-950 text-xl hover:bg-red-900">
            &#128717;
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-red-700">
              {cartCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
