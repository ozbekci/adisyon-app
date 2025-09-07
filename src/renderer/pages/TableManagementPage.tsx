import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { TableCategory, Table } from '../../shared/types';
import CategoryFormWindow from '../components/CategoryFormWindow';
import CategoryDeleteWindow from '../components/CategoryDeleteWindow';
import CategoryTablesPage from '../components/CategoryTablesPage';

const TableManagementPage: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.auth);
  const [categories, setCategories] = useState<TableCategory[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TableCategory | null>(null);
  const [showCategoryWindow, setShowCategoryWindow] = useState(false);
  const [showDeleteWindow, setShowDeleteWindow] = useState(false);
  const [showCategoryTables, setShowCategoryTables] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TableCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, tablesData] = await Promise.all([
        window.electronAPI.getTableCategories(),
        window.electronAPI.getTables()
      ]);
      setCategories(categoriesData);
      setTables(tablesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Kategori işlemleri
  const openCategoryWindow = (category?: TableCategory) => {
    setSelectedCategory(category || null);
    setShowCategoryWindow(true);
  };

  const handleCategorySave = async (formData: { name: string; color: string }) => {
    try {
      if (selectedCategory) {
        // Güncelleme
        await window.electronAPI.updateTableCategory(selectedCategory.id, formData);
      } else {
        // Yeni ekleme
        await window.electronAPI.createTableCategory(formData);
      }
      
      setShowCategoryWindow(false);
      setSelectedCategory(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      alert(`Kategori kaydedilirken hata oluştu: ${error.message || error}`);
    }
  };

  const openDeleteWindow = (category: TableCategory) => {
    setCategoryToDelete(category);
    setShowDeleteWindow(true);
  };

  const handleCategoryDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      await window.electronAPI.deleteTableCategory(categoryToDelete.id);
      setShowDeleteWindow(false);
      setCategoryToDelete(null);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Kategori silinirken hata oluştu');
    }
  };

  const openCategoryTables = (category: TableCategory) => {
    setSelectedCategory(category);
    setShowCategoryTables(true);
  };

  // CategoryTablesPage gösteriliyorsa onu render et
  if (showCategoryTables && selectedCategory) {
    return (
      <CategoryTablesPage
        category={selectedCategory}
        onBack={() => {
          setShowCategoryTables(false);
          setSelectedCategory(null);
        }}
      />
    );
  }

  // Yetki kontrolü ve yeni pencere render'ları
  if (showCategoryWindow) {
    return (
      <CategoryFormWindow
        category={selectedCategory}
        onSave={handleCategorySave}
        onCancel={() => {
          setShowCategoryWindow(false);
          setSelectedCategory(null);
        }}
      />
    );
  }

  if (showDeleteWindow && categoryToDelete) {
    return (
      <CategoryDeleteWindow
        category={categoryToDelete}
        tableCount={tables.filter(t => t.categoryId === categoryToDelete.id).length}
        onConfirm={handleCategoryDeleteConfirm}
        onCancel={() => {
          setShowDeleteWindow(false);
          setCategoryToDelete(null);
        }}
      />
    );
  }

  // Yetki kontrolü
  if (currentUser?.role !== 'manager') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Yetkisiz Erişim</h2>
          <p className="text-white/70">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-white/80">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Masa Yönetimi</h1>
        <p className="text-white/70">Masa kategorilerini seçin ve masaları yönetin</p>
      </div>

      {/* Kategoriler Grid */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Masa Kategorileri</h2>
          <button onClick={() => openCategoryWindow()} className="btn-primary">
            Yeni Kategori
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {categories.map((category) => {
            const tableCount = tables.filter(t => t.categoryId === category.id).length;
            return (
              <div 
                key={category.id} 
                className="group relative card hover:bg-white/10 transition-all duration-200 cursor-pointer"
                style={{ borderLeft: `6px solid ${category.color}` }}
                onClick={() => openCategoryTables(category)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-6 h-6 rounded-full shadow-sm"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategoryWindow(category);
                        }}
                        className="text-blue-300 hover:text-blue-200 p-1 rounded"
                        title="Düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteWindow(category);
                        }}
                        className="text-rose-300 hover:text-rose-200 p-1 rounded"
                        title="Sil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-center">{category.name}</h3>
                  <p className="text-sm text-white/70 text-center">
                    {tableCount} masa
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Henüz kategori yok</h3>
            <p className="text-white/70 mb-4">İlk masa kategorinizi oluşturun</p>
            <button onClick={() => openCategoryWindow()} className="btn-primary">
              İlk Kategoriyi Oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableManagementPage;
