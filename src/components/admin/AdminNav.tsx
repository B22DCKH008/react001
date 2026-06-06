import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin/products', label: 'Sản phẩm' },
  { to: '/admin/categories', label: 'Danh mục' },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/orders', label: 'Đơn hàng' },
];

export default function AdminNav() {
  return (
    <div className="mb-6 rounded-[8px] border border-red-100 bg-white p-2 shadow-sm">
      <div className="grid gap-2 sm:grid-cols-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `rounded-[8px] px-4 py-3 text-center text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 text-gray-700 hover:bg-red-100 hover:text-red-700'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
