import React from 'react';
import { TableCategory } from '../../shared/types';

interface CategoryDeleteWindowProps {
  category: TableCategory;
  tableCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const CategoryDeleteWindow: React.FC<CategoryDeleteWindowProps> = ({
  category,
  tableCount,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="min-h-screen bg-black bg-opacity-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="p-6 text-center">
          {/* Kategori Rengi */}
          <div className="flex justify-center mb-4">
            <div 
              className="w-12 h-12 rounded-full shadow-lg" 
              style={{ backgroundColor: category.color }}
            ></div>
          </div>

          {/* Kategori İsmi */}
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {category.name}
          </h2>

          {/* Emin misiniz yazısı */}
          <p className="text-gray-600 mb-6">
            Bu kategoriyi silmek istediğinizden emin misiniz?
          </p>

          {/* Butonlar */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDeleteWindow;
