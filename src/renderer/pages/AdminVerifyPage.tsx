import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

const AdminVerifyPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { currentUser } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (currentUser?.role === 'manager' || currentUser?.role === 'cashier') {
        await (window as any).electronAPI.adminVerified();
      } else {
        setError('Bu işlem için yetkiniz yok.');
      }
    } catch (err) {
      setError('Doğrulama başarısız oldu.');
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="card p-8 w-96">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Yönetici Doğrulama</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
              Yönetici Şifresi
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => (window as any).electronAPI.closeAdminWindow()}
              className="btn-secondary flex-1"
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Doğrula
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminVerifyPage;