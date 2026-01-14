import React from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';

export default function LoginForm({ username, setUsername, password, setPassword, handleLogin, loading, message }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white shadow-md rounded-full mx-auto mb-3">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Chấm Công ERP</h2>
          <p className="text-sm text-gray-500 mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Tài khoản ERP</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập tài khoản"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập mật khẩu"
                required
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${message.toLowerCase().includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:opacity-95 transition-colors disabled:opacity-60"
          >
            {loading ? 'Đang xử lý...' : (
              <>
                <LogIn className="w-5 h-5" />
                Đăng nhập
              </>
            )}
          </button>

          <div className="text-center text-xs text-gray-400">
            <span>Phiên bản demo • Responsive trên điện thoại và desktop</span>
          </div>
        </form>
      </div>
    </div>
  );
}
