import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as { response?: { data?: { message?: string | string[] } } };
  const message = apiError.response?.data?.message;

  if (Array.isArray(message)) return message[0] || fallback;
  return message || fallback;
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Họ tên không được vượt quá 50 ký tự');
      return;
    }
    if (trimmedEmail.length > 254) {
      setError('Email không được vượt quá 254 ký tự');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự');
      return;
    }
    if (password.length > 72) {
      setError('Mật khẩu không được vượt quá 72 ký tự');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.register(trimmedName, trimmedEmail, password);
      navigate('/login', { state: { message: 'Đăng ký thành công! Vui lòng đăng nhập.' } });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-700 px-4 py-10">
      <div className="absolute left-[10%] top-[18%] h-7 w-7 rotate-[-14deg] rounded-lg bg-white/15" />
      <div className="absolute left-[27%] bottom-[28%] h-24 w-24 rotate-[-4deg] rounded-2xl bg-white/20" />
      <div className="absolute right-[28%] top-[68%] h-7 w-7 rotate-[-5deg] rounded-md bg-white/20" />
      <div className="absolute right-[11%] bottom-[6%] h-32 w-32 rounded-2xl bg-white/25" />

      <div className="relative w-full max-w-xl rounded-[8px] bg-blue-950/70 px-9 py-12 shadow-2xl sm:px-11">
        <h1 className="mb-6 text-center text-3xl font-bold uppercase text-white">Đăng ký</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="block">
            <span className="text-xl font-bold text-white/85">
              Họ tên <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              placeholder="Nhập họ tên"
              className="mt-4 w-full border-0 border-b border-white/55 bg-transparent px-0 pb-3 text-xl font-semibold text-white outline-none placeholder:text-white/40 focus:border-yellow-300"
            />
          </label>

          <label className="block">
            <span className="text-xl font-bold text-white/85">
              Email <span className="text-red-400">*</span>
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              placeholder="Nhập Email"
              className="mt-4 w-full border-0 border-b border-white/55 bg-transparent px-0 pb-3 text-xl font-semibold text-white outline-none placeholder:text-white/40 focus:border-yellow-300"
            />
          </label>

          <label className="block">
            <span className="text-xl font-bold text-white/85">
              Mật khẩu <span className="text-red-400">*</span>
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              maxLength={72}
              placeholder="Tối thiểu 6 ký tự"
              className="mt-4 w-full border-0 border-b border-white/55 bg-transparent px-0 pb-3 text-xl font-semibold text-white outline-none placeholder:text-white/40 focus:border-yellow-300"
            />
          </label>

          {error && <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-14 w-full rounded-full bg-yellow-300 text-2xl font-bold text-gray-800 transition-colors hover:bg-yellow-200 disabled:opacity-60"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="mt-6 text-center text-lg font-semibold text-white/85">
          Bạn đã có tài khoản{' '}
          <Link to="/login" className="font-bold text-yellow-300 hover:text-yellow-200">
            Đăng nhập tại đây
          </Link>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-5">
          <button className="h-14 rounded-[6px] bg-red-600 text-xl font-bold text-white transition-colors hover:bg-red-500">
            G&nbsp; Google
          </button>
          <button className="h-14 rounded-[6px] bg-blue-800/70 text-xl font-bold text-white transition-colors hover:bg-blue-800">
            f&nbsp; Facebook
          </button>
        </div>
      </div>
    </div>
  );
}
