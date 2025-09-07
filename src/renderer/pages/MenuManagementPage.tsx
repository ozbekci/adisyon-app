import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
}

// interface MenuManagementPageProps {
//   onClose: () => void;
//   onShowAddCategory?: () => void;
//   onShowAddMenuItem?: () => void;
// }

const MenuManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  });

  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6B7280");

  // Önceden tanımlı renkler
  const predefinedColors = [
    { name: "Gri", value: "#6B7280" },
    { name: "Mavi", value: "#3B82F6" },
    { name: "Yeşil", value: "#10B981" },
    { name: "Sarı", value: "#F59E0B" },
    { name: "Kırmızı", value: "#EF4444" },
    { name: "Mor", value: "#8B5CF6" },
    { name: "Pembe", value: "#EC4899" },
    { name: "Turuncu", value: "#F97316" },
  ];

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    try {
      // Menü öğelerini ve kategorilerini paralel olarak yükle
      const [items, menuCategories] = await Promise.all([
        (window as any).electronAPI.getMenuItems(),
        (window as any).electronAPI.getMenuCategories(),
      ]);
      setMenuItems(items);

      // Önce veritabanındaki kategorileri kullan
      setCategories(menuCategories);

      setLoading(false);
    } catch (error) {
      console.error("Error loading menu data:", error);
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory
    ? menuItems.filter((item) => item.category === selectedCategory)
    : menuItems;

  const handleDeleteItem = async (id: number) => {
    if (confirm("Bu ürünü silmek istediğinizden emin misiniz?")) {
      try {
        await (window as any).electronAPI.deleteMenuItem(id);
        await loadMenuData();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const handleAddMenuItem = async () => {
    navigate("/add-menu-item");
  };

  const handleAddCategory = () => {
    navigate("/add-category");
  };

  const handleEditCategory = (category: any) => {
    navigate(`/edit-category/${category.id}`);
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (
      confirm(
        "Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategorideki tüm ürünler de etkilenebilir."
      )
    ) {
      try {
        console.log("Deleting category with ID:", categoryId);
        await (window as any).electronAPI.deleteMenuCategory(categoryId);
        await loadMenuData();
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: "",
      description: "",
      price: "",
      category: "",
      available: true,
    });
    setEditingItem(null);
    setShowItemForm(false);
  };

  const startEditItem = (item: MenuItem) => {
    navigate('/add-menu-item', { state: { from: '/menu-management', editingItem: item } });
  };  

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Geri</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Menü Yönetimi</h1>
            <p className="text-sm text-white/70">Ürünleri ve kategorileri yönetin</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-3">
          <button onClick={handleAddMenuItem} className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            <span>Yeni Ürün</span>
          </button>
          <button onClick={handleAddCategory} className="btn-secondary inline-flex items-center gap-2">
            <TagIcon className="h-5 w-5" />
            <span>Yeni Kategori</span>
          </button>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Kategoriler</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full border transition ${
              !selectedCategory
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
            }`}
          >
            Tümü ({menuItems.length})
          </button>

          {categories.map((category) => {
            const isActive = selectedCategory === category.name;
            return (
              <div key={category.id} className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full border transition flex items-center gap-2 ${
                    isActive
                      ? "text-white border-white/30"
                      : "text-white/80 border-white/10 hover:bg-white/10"
                  }`}
                  style={{
                    backgroundColor: isActive ? category.color || "#6B7280" : "transparent",
                  }}
                >
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: category.color || "#6B7280" }} />
                  <span>
                    {category.name} ({
                      menuItems.filter((item) => item.category === category.name).length
                    })
                  </span>
                </button>
                <div className="flex">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                    title="Kategoriyi düzenle"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    title="Kategoriyi sil"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="card flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="card">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-white/70 mb-2 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-emerald-400">₺{item.price.toFixed(2)}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.available
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-rose-500/15 text-rose-300"
                          }`}
                        >
                          {item.available ? "Mevcut" : "Mevcut Değil"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded">{item.category}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditItem(item)}
                        className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-400/10"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagementPage;
