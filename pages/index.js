import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, MapPin, User, Lock, AlertCircle, CheckCircle, Navigation } from 'lucide-react';

export default function AttendanceApp() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [sessionData, setSessionData] = useState(null);

  // ERP Configuration - hardcoded for demo, replace with your actual values
  const erpConfig = {
    url: 'https://erp.wgroup.vn',
    apiEndpoint: '/jsonrpc',
    database: 'erp',
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    requestLocation();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLoggedIn && sessionData) {
      checkStatus();
    }
  }, [isLoggedIn, sessionData]);

  // Lấy vị trí GPS
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('GPS không khả dụng:', error.message);
        }
      );
    }
  };

  // Mock API cho demo
  const mockErpApi = (method, params) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (method === 'call' && params.service === 'common' && params.method === 'authenticate') {
          if (params.args[1] && params.args[2]) {
            resolve({
              uid: 1,
              session_id: 'mock_session_' + Date.now()
            });
          } else {
            throw new Error('Thông tin đăng nhập không hợp lệ');
          }
        } else if (method === 'call' && params.service === 'object') {
          if (params.method === 'execute_kw') {
            const action = params.args[4];
            
            if (action === 'check_in') {
              resolve({
                success: true,
                id: Date.now(),
                time: new Date().toISOString()
              });
            } else if (action === 'check_out') {
              resolve({
                success: true,
                id: Date.now(),
                time: new Date().toISOString()
              });
            } else if (action === 'get_status') {
              resolve({
                status: status || 'checked-out',
                last_update: new Date().toISOString()
              });
            }
          }
        }
        resolve({});
      }, 500);
    });
  };

  // Gọi JSON-RPC API
  const callErpApi = async (method, params = {}) => {
    const apiUrl = `${erpConfig.url}${erpConfig.apiEndpoint}`;
    
    const request = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: Date.now()
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData && { 'X-Session-Id': sessionData.session_id }),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'ERP API Error');
      }

      return data.result;
    } catch (error) {
      // Fallback to mock data for demo
      return mockErpApi(method, params);
    }
  };

  // Đăng nhập Odoo
  const handleLogin = async () => {
    if (!username || !password) {
      setMessage('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await callErpApi('call', {
        service: 'common',
        method: 'authenticate',
        args: [
          erpConfig.database,
          username,
          password,
          {}
        ]
      });

      if (result && result.uid) {
        setSessionData({
          uid: result.uid,
          session_id: result.session_id,
          username: username
        });
        setIsLoggedIn(true);
        setMessage('Đăng nhập thành công');
        setPassword('');
      } else {
        setMessage('Đăng nhập thất bại');
      }
    } catch (error) {
      setMessage(error.message || 'Lỗi kết nối ERP server');
    } finally {
      setLoading(false);
    }
  };

  // Chấm công vào
  const handleCheckIn = async () => {
    if (!address.trim()) {
      setMessage('Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await callErpApi('call', {
        service: 'object',
        method: 'execute_kw',
        args: [
          erpConfig.database,
          sessionData.uid,
          password,
          'hr.attendance',
          'check_in',
          [],
          {
            address: address,
            latitude: location.lat,
            longitude: location.lng,
            check_in: new Date().toISOString()
          }
        ]
      });

      if (result && result.success) {
        setStatus('checked-in');
        setMessage('Chấm công vào thành công lúc ' + new Date().toLocaleTimeString('vi-VN'));
        setAddress('');
      }
    } catch (error) {
      setMessage(error.message || 'Lỗi chấm công');
    } finally {
      setLoading(false);
    }
  };

  // Chấm công ra
  const handleCheckOut = async () => {
    if (!address.trim()) {
      setMessage('Vui lòng nhập địa chỉ');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await callErpApi('call', {
        service: 'object',
        method: 'execute_kw',
        args: [
          erpConfig.database,
          sessionData.uid,
          password,
          'hr.attendance',
          'check_out',
          [],
          {
            address: address,
            latitude: location.lat,
            longitude: location.lng,
            check_out: new Date().toISOString()
          }
        ]
      });

      if (result && result.success) {
        setStatus('checked-out');
        setMessage('Chấm công ra thành công lúc ' + new Date().toLocaleTimeString('vi-VN'));
        setAddress('');
      }
    } catch (error) {
      setMessage(error.message || 'Lỗi chấm công');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái
  const checkStatus = async () => {
    if (!sessionData) return;

    try {
      const result = await callErpApi('call', {
        service: 'object',
        method: 'execute_kw',
        args: [
          erpConfig.database,
          sessionData.uid,
          password,
          'hr.attendance',
          'get_status',
          []
        ]
      });

      if (result && result.status) {
        setStatus(result.status);
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
    setSessionData(null);
    setMessage('Đã đăng xuất');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
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
            <p className="text-gray-600 mt-2">Đăng nhập bằng tài khoản ERP</p>
            <p className="text-xs text-gray-400 mt-2">Demo mode - Server: {erpConfig.url}</p>
          </div>

          <div className="space-y-4">
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
                  onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tài khoản"
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
                  onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập mật khẩu"
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
              onClick={handleLogin}
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
          </div>
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
                {location.lat && (
                  <p className="text-xs text-blue-200 mt-1 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </p>
                )}
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