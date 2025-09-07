import React, { useState } from 'react';
import { XMarkIcon, BackspaceIcon } from '@heroicons/react/24/outline';

interface AdminPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({ onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleNumberClick = (number: number) => {
    if (password.length < 6) { // Maksimum 6 karakter
      setPassword(prev => prev + number);
    }
  };

  const handleBackspace = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPassword('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError('');

    try {
      // Admin kullanıcısının şifresini kontrol et
      const user = await (window as any).electronAPI.authenticateUser('admin', password);
      if (user && (user.role === 'manager' || user.role === 'cashier')) {
        onSuccess();
      } else {
        setError('Yanlış şifre!');
        setPassword('');
      }
    } catch (error) {
      console.error('Doğrulama hatası:', error);
      setError('Bir hata oluştu. Tekrar deneyin.');
      setPassword('');
    }
  };

  // Numerik tuş takımı düzeni
  const numberPad = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
    ['clear', 0, 'backspace']
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Yönetici Şifresi</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          {/* Şifre Gösterimi */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <div className="flex justify-center items-center h-12 bg-white rounded-md border border-gray-300">
              {password ? (
                <div className="text-2xl tracking-widest font-mono">
                  {'*'.repeat(password.length)}
                </div>
              ) : (
                <span className="text-gray-400">PIN Giriniz</span>
              )}
            </div>
          </div>

          {/* Numerik Tuş Takımı */}
          <div className="grid grid-cols-3 gap-3">
            {numberPad.map((row, rowIndex) => (
              <React.Fragment key={rowIndex}>
                {row.map((key, colIndex) => {
                  if (key === 'clear') {
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={handleClear}
                        className="p-4 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Temizle
                      </button>
                    );
                  }
                  if (key === 'backspace') {
                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={handleBackspace}
                        className="p-4 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <BackspaceIcon className="h-6 w-6 text-gray-600" />
                      </button>
                    );
                  }
                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleNumberClick(key as number)}
                      className="p-4 text-2xl font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
                    >
                      {key}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center mb-4 bg-red-50 p-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={!password}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Doğrula
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPasswordModal;
