import React, { useState, useEffect } from 'react';
import { TableCategory } from '../../shared/types';
import { XMarkIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

interface CategoryFormWindowProps {
  category?: TableCategory | null;
  onSave: (data: { name: string; color: string }) => void;
  onCancel: () => void;
}

const CategoryFormWindow: React.FC<CategoryFormWindowProps> = ({
  category,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });

  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        color: category.color
      });
    } else {
      setFormData({
        name: '',
        color: '#3B82F6'
      });
    }
    setErrors({});
  }, [category]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Kategori adı gereklidir';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Kategori adı en az 2 karakter olmalıdır';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const colorOptions = [
    { color: '#EF4444', name: 'Kırmızı', bg: 'bg-red-500' },
    { color: '#F97316', name: 'Turuncu', bg: 'bg-orange-500' },
    { color: '#F59E0B', name: 'Sarı', bg: 'bg-yellow-500' },
    { color: '#10B981', name: 'Yeşil', bg: 'bg-green-500' },
    { color: '#3B82F6', name: 'Mavi', bg: 'bg-blue-500' },
    { color: '#8B5CF6', name: 'Mor', bg: 'bg-purple-500' },
    { color: '#EC4899', name: 'Pembe', bg: 'bg-pink-500' },
    { color: '#6B7280', name: 'Gri', bg: 'bg-gray-500' },
    { color: '#000000', name: 'Siyah', bg: 'bg-black' },
    { color: '#FFFFFF', name: 'Beyaz', bg: 'bg-white' },
    { color: '#92400E', name: 'Kahverengi', bg: 'bg-yellow-800' },
    { color: '#1F2937', name: 'Koyu Gri', bg: 'bg-gray-800' }
  ];

  const selectedColorInfo = colorOptions.find(c => c.color === formData.color);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {category ? (
                <PencilIcon className="h-8 w-8" />
              ) : (
                <PlusIcon className="h-8 w-8" />
              )}
              <h1 className="text-2xl font-bold">
                {category ? 'Kategori Düzenle' : 'Yeni Kategori'}
              </h1>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <p className="mt-2 text-blue-100">
            {category ? 'Kategori bilgilerini güncelleyin' : 'Yeni masa kategorisi oluşturun'}
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Kategori Adı */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Kategori Adı
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) {
                      setErrors({ ...errors, name: undefined });
                    }
                  }}
                  className={`w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none transition-all ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="Örn: VIP Masalar, Bahçe, Salon..."
                  autoFocus
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Renk Seçimi */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-4">
                Kategori Rengi
              </label>
              
              {/* Renk Paleti */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {colorOptions.map(({ color, name }) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`group relative transition-all duration-200 ${
                        formData.color === color 
                          ? 'ring-2 ring-blue-500 ring-opacity-50' 
                          : 'hover:ring-1 hover:ring-gray-300'
                      } ${color === '#FFFFFF' ? 'border border-gray-300' : ''}`}
                      style={{ 
                        backgroundColor: color,
                        width: '20px',
                        height: '20px',
                        minWidth: '20px',
                        minHeight: '20px'
                      }}
                      title={name}
                    >
                      {formData.color === color && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg 
                            className={`w-3 h-3 ${
                              color === '#FFFFFF' || color === '#F59E0B' || color === '#10B981'
                                ? 'text-gray-800' 
                                : 'text-white'
                            }`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Seçili Renk Önizleme */}
                <div className="flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300" 
                      style={{ backgroundColor: formData.color }}
                    ></div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Seçili Renk</p>
                      <p className="font-semibold text-gray-800">
                        {selectedColorInfo?.name || 'Bilinmeyen'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
              >
                İptal
              </button>
              <button 
                type="submit" 
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {category ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormWindow;
