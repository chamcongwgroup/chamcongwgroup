import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, MapPin, User, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function AttendanceApp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    checkStatus();
    return () => clearInterval(timer);
  }, []);

  const makeJsonRpcRequest = async (method, params = {}) => {
    const request = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: Date.now()
    };

    // Giả lập API call - trong production, thay bằng endpoint thực
    return new Promise((resolve) => {
      setTimeout(() => {
        if (method === 'auth.login') {
          if (params.username && params.password) {
            resolve({
              jsonrpc: '2.0',
              result: {
                success: true,
                message: 'Đăng nhập thành công',
                user: { username: params.username, role: 'employee' }
              },
              id: request.id
            });
          } else {
            resolve({
              jsonrpc: '2.0',
              error: { code: -32600, message: 'Thông tin đăng nhập không hợp lệ' },
              id: request.id
            });
          }
        } else if (method === 'attendance.checkIn') {
          if (params.address) {
            resolve({
              jsonrpc: '2.0',
              result: {
                success: true,
                message: 'Chấm công vào thành công',
                time: new Date().toISOString(),
                address: params.address
              },
              id: request.id
            });
          } else {
            resolve({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Địa chỉ là bắt buộc' },
              id: request.id
            });
          }
        } else if (method === 'attendance.checkOut') {
          if (params.address) {
            resolve({
              jsonrpc: '2.0',
              result: {
                success: true,
                message: 'Chấm công ra thành công',
                time: new Date().toISOString(),
                address: params.address
              },
              id: request.id
            });
          } else {
            resolve({
              jsonrpc: '2.0',
              error: { code: -32602, message: 'Địa chỉ là bắt buộc' },
              id: request.id
            });
          }
        } else if (method === 'attendance.status') {
          resolve({
            jsonrpc: '2.0',
            result: {
              isCheckedIn: isLoggedIn,
              lastUpdate: new Date().toISOString()
            },
            id: request.id
          });
        }
      }, 500);
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await makeJsonRpcRequest('auth.login', { username, password });
      
      if (response.result && response.result.success) {
        setIsLoggedIn(true);
        setMessage(response.result.message);
        setPassword('');
      } else if (response.error) {
        setMessage(response.error.message);
      }
    } catch (error) {
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!address.trim()) {
      setMessage('Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await makeJsonRpcRequest('attendance.checkIn', { address });
      
      if (response.result && response.result.success) {
        setStatus('checked-in');
        setMessage(response.result.message + ' lúc ' + new Date(response.result.time).toLocaleTimeString('vi-VN'));
        setAddress('');
      } else if (response.error) {
        setMessage(response.error.message);
      }
    } catch (error) {
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!address.trim()) {
      setMessage('Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await makeJsonRpcRequest('attendance.checkOut', { address });
      
      if (response.result && response.result.success) {
        setStatus('checked-out');
        setMessage(response.result.message + ' lúc ' + new Date(response.result.time).toLocaleTimeString('vi-VN'));
        setAddress('');
      } else if (response.error) {
        setMessage(response.error.message);
      }
    } catch (error) {
      setMessage('Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await makeJsonRpcRequest('attendance.status');
      if (response.result) {
        setStatus(response.result.isCheckedIn ? 'checked-in' : 'checked-out');
      }
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setAddress('');
    setStatus(null);
    setMessage('Đã đăng xuất');
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Chấm Công ERP</h1>
            <p className="text-gray-600 mt-2">Đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tài khoản ERP
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tài khoản"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                message.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {loading ? 'Đang xử lý...' : (
                <>
                  <LogIn className="w-5 h-5" />
                  Đăng nhập
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Chấm Công</h1>
                <p className="text-blue-100 mt-1">Xin chào, {username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-800">
                  {currentTime.toLocaleTimeString('vi-VN')}
                </div>
                <div className="text-gray-600 mt-2">
                  {currentTime.toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                status === 'checked-in' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  Trạng thái: {status === 'checked-in' ? 'Đã chấm công vào' : 'Đã chấm công ra'}
                </span>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ (bắt buộc)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ của bạn"
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-center gap-2 mb-6 ${
                message.includes('thành công') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCheckIn}
                disabled={loading || status === 'checked-in'}
                className="bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Chấm Công Vào
              </button>

              <button
                onClick={handleCheckOut}
                disabled={loading || status === 'checked-out'}
                className="bg-orange-600 text-white py-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Chấm Công Ra
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}