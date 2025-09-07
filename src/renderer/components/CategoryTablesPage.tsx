import React, { useState, useEffect } from 'react';
import { TableCategory, Table } from '../../shared/types';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  TableCellsIcon 
} from '@heroicons/react/24/outline';

interface CategoryTablesPageProps {
  category: TableCategory;
  onBack: () => void;
}

const CategoryTablesPage: React.FC<CategoryTablesPageProps> = ({
  category,
  onBack
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Masa form state
  const [tableForm, setTableForm] = useState({
    number: '',
    seats: 4,
    categoryId: category.id,
    x: 0,
    y: 0
  });

  useEffect(() => {
    loadTables();
  }, [category.id]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const allTables = await window.electronAPI.getTables();
      const categoryTables = allTables.filter(table => table.categoryId === category.id);
      setTables(categoryTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTable) {
        // Güncelleme
        await window.electronAPI.updateTable(selectedTable.id, tableForm);
      } else {
        // Yeni ekleme
        await window.electronAPI.createTable(tableForm);
      }
      setShowTableModal(false);
      setTableForm({ number: '', seats: 4, categoryId: category.id, x: 0, y: 0 });
      setSelectedTable(null);
      loadTables();
    } catch (error) {
      console.error('Error saving table:', error);
      alert('Masa kaydedilirken hata oluştu');
    }
  };

  const handleTableEdit = (table: Table) => {
    setSelectedTable(table);
    setTableForm({
      number: table.number,
      seats: table.seats,
      categoryId: table.categoryId,
      x: table.x || 0,
      y: table.y || 0
    });
    setShowTableModal(true);
  };

  const handleTableDelete = async (tableId: number) => {
    if (confirm('Bu masayı silmek istediğinizden emin misiniz?')) {
      try {
        await window.electronAPI.deleteTable(tableId);
        loadTables();
      } catch (error: any) {
        alert(error.message || 'Masa silinirken hata oluştu');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div 
              className="w-12 h-12 rounded-xl mr-4" 
              style={{ backgroundColor: category.color }}
            ></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {category.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {tables.length} masa bulunuyor
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedTable(null);
              setTableForm({ 
                number: '', 
                seats: 4, 
                categoryId: category.id, 
                x: 0, 
                y: 0 
              });
              setShowTableModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Yeni Masa</span>
          </button>
        </div>
      </div>

      {/* Masalar Grid */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {tables.length === 0 ? (
          <div className="text-center py-16">
            <TableCellsIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Bu kategoride masa bulunmuyor
            </h3>
            <p className="text-gray-500 mb-6">
              İlk masayı eklemek için "Yeni Masa" butonuna tıklayın
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map((table) => (
              <div
                key={table.id}
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {table.number}
                    </h3>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleTableEdit(table)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleTableDelete(table.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Kişi Sayısı:</span>
                    <span className="font-medium">{table.seats} kişi</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Durum:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      table.status === 'available' ? 'bg-green-100 text-green-800' :
                      table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                      table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {table.status === 'available' ? 'Müsait' :
                       table.status === 'occupied' ? 'Dolu' :
                       table.status === 'reserved' ? 'Rezerve' : 'Temizlik'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Masa Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform animate-scaleIn">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {selectedTable ? 'Masa Düzenle' : 'Yeni Masa'}
            </h3>
            <form onSubmit={handleTableSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Masa Numarası
                </label>
                <input
                  type="text"
                  value={tableForm.number}
                  onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Örn: T1, Masa 1"
                  required
                />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Kişi Sayısı
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tableForm.seats}
                  onChange={(e) => setTableForm({ ...tableForm, seats: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTableModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                >
                  {selectedTable ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryTablesPage;
