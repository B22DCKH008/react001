import { NavLink } from 'react-router-dom';

const links = [
  { to: '/admin/products', label: 'Sản phẩm' },
  { to: '/admin/categories', label: 'Danh mục' },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/orders', label: 'Đơn hàng' },
];

export default function AdminNav() {
  return (
    <div className="bg-purple-50 border border-purple-100 rounded-xl flex gap-1 p-1 mb-6">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-purple-600'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}
