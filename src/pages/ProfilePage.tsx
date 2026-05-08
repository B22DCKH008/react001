import { useAuth } from '../store/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tài khoản</h1>
      {user && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-2">
          <p><span className="font-medium">Họ tên:</span> {user.name}</p>
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Role:</span> {user.role}</p>
        </div>
      )}
    </div>
  );
}
