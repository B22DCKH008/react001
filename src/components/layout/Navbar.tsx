import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">ShopApp</Link>

        <div className="flex items-center gap-4 text-sm">
          <Link to="/" className="text-gray-600 hover:text-blue-600">Sản phẩm</Link>

          {isLoggedIn ? (
            <>
              <Link to="/cart" className="text-gray-600 hover:text-blue-600">Giỏ hàng</Link>
              <Link to="/orders" className="text-gray-600 hover:text-blue-600">Đơn hàng</Link>
              <Link to="/profile" className="text-gray-600 hover:text-blue-600">{user?.name}</Link>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-blue-600">Đăng nhập</Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
