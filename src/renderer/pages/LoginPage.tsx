import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { loginUser, clearError } from '../store/slices/authSlice';
import { UserIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('Giriş başarılı, dashboarda yönlendiriliyor...');
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      console.log('Giriş denemesi başlatıldı:', username);
      dispatch(loginUser({ username, password }));
    }
  };

  const handleInputChange = () => {
    if (error) {
      dispatch(clearError());
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Adisyon POS
          </h1>
          <h2 className="text-xl text-white/70">
            Seyyar Yazılım
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white">
                Kullanıcı Adı
              </label>
              <div className="mt-1 relative">
                <div className="absolute top-1/2 left-0 pl-3 flex items-center pointer-events-none transform -translate-y-1/2">
                  <UserIcon className="h-5 w-5 text-white/30" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    handleInputChange();
                  }}
                  className="appearance-none block w-full pl-10 pr-3 py-2 rounded-md placeholder-white/50 focus:outline-none focus:ring-2"
                  style={{ background: '#fff', color: '#111827', border: '1px solid #09090aff' }}
                  placeholder=" Kullanıcı adınızı girin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Şifre
              </label>
              <div className="mt-1 relative">
                <div className="absolute top-1/2 left-0 pl-3 flex items-center pointer-events-none transform -translate-y-1/2">
                  <LockClosedIcon className="h-5 w-5 text-black/60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    handleInputChange();
                  }}
                  className="appearance-none block w-full pl-10 pr-3 py-2 rounded-md placeholder-white/50 focus:outline-none focus:ring-2"
                  style={{ background: '#fff', color: '#111827', border: '1px solid #d1d5db' }}
                  placeholder=" Şifrenizi girin"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-500/10 p-4 border border-red-500/30">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-300" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-200">Giriş Hatası</h3>
                    <div className="mt-2 text-sm text-red-300">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim()}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
