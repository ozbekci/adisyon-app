import React, { useState, useEffect } from "react";
import { ArrowLeftIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";

// interface AddMenuItemPageProps {
//   onBack: () => void;
//   onItemAdded: () => void;
// }

const AddMenuItemPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, editingItem } = location.state || {};
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setIsEditing(true);
      setFormData({
        name: editingItem.name,
        description: editingItem.description,
        price: editingItem.price.toString(),
        category: editingItem.category,
        available: editingItem.available,
      });
    }
  }, [editingItem]);

  const handleBack = () => {
    // Eğer state'de from bilgisi varsa oraya git, yoksa varsayılan olarak menu-management'e git
    if (from) {
      navigate(from);
    } else {
      navigate("/menu-management");
    }
  };

  const loadCategories = async () => {
    try {
      // Önce menü kategorilerini al
      const menuCategories = await (
        window as any
      ).electronAPI.getMenuCategories();
      const categoryNames = menuCategories.map((cat: any) => cat.name);

      // Eğer kategori yoksa, mevcut ürünlerden kategori çıkar
      if (categoryNames.length === 0) {
        const items = await (window as any).electronAPI.getMenuItems();
        const uniqueCategories = [
          ...new Set(items.map((item: any) => item.category)),
        ].filter(Boolean) as string[];
        setCategories(uniqueCategories);
      } else {
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      // Hata durumunda mevcut ürünlerden kategori çıkarmaya çalış
      try {
        const items = await (window as any).electronAPI.getMenuItems();
        const uniqueCategories = [
          ...new Set(items.map((item: any) => item.category)),
        ].filter(Boolean) as string[];
        setCategories(uniqueCategories);
      } catch (fallbackError) {
        console.error("Error loading categories from items:", fallbackError);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Ürün adı gereklidir");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Geçerli bir fiyat giriniz");
      return;
    }

    if (!formData.category) {
      setError("Kategori seçiniz");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Mevcut ürünleri kontrol et
      const existingItems = await (window as any).electronAPI.getMenuItems();
      const duplicateItem = existingItems.find(
        (item: any) =>
          item.name.toLowerCase().trim() ===
            formData.name.toLowerCase().trim() &&
          item.category === formData.category
      );

      if (duplicateItem && !isEditing) {
        setError(
          `"${formData.name}" isimli bir ürün ${formData.category} kategorisinde zaten mevcut!`
        );
        setLoading(false);
        return;
      }

      const menuItemData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        available: formData.available,
      };

      console.log("Sending menu item data:", menuItemData);

      if (isEditing && editingItem) {
        // Güncelleme işlemi
        await (window as any).electronAPI.updateMenuItem(
          editingItem.id,
          menuItemData
        );
        console.log("Menu item updated successfully!");
      } else {
        // Yeni ürün ekleme işlemi
        await (window as any).electronAPI.createMenuItem(menuItemData);
        console.log("Menu item created successfully!");
      }

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        available: true,
      });

      // Başarılı olduğunda, geldiği sayfaya geri dön
      if (from) {
        navigate(from);
      } else {
        navigate("/menu-management");
      }
    } catch (error) {
      console.error("Error adding menu item:", error);
      // Hatanın detayını göster
      if (error && typeof error === "object" && "message" in error) {
        setError(`Ürün eklenirken hata oluştu: ${error.message}`);
      } else {
        setError("Ürün eklenirken hata oluştu");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (error) setError("");
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" /> Geri Dön
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
            </h1>
            <p className="text-white/70">Menüye yeni ürün ekleyin</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white mb-2"
              >
                Ürün Adı *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input"
                placeholder="Örn: Karışık Pizza, Adana Kebap"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-white mb-2"
              >
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="input"
                placeholder="Ürün hakkında detaylı açıklama"
              />
            </div>

            {/* Price and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Fiyat *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Örn: 99.99"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Kategori *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Kategori Seçiniz</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Available Checkbox */}
            <div className="flex items-center">
              <input
                id="available"
                name="available"
                type="checkbox"
                checked={formData.available}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-white/20 rounded focus:ring-blue-500"
              />
              <label
                htmlFor="available"
                className="ml-2 block text-sm text-white/90"
              >
                Ürün aktif (satışa açık)
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    {isEditing ? "Güncelleniyor..." : "Ekleniyor..."}
                  </>
                ) : isEditing ? (
                  <>
                    <PencilIcon className="h-4 w-4 mr-2" /> Ürün Güncelle
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-4 w-4 mr-2" /> Ürün Ekle
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMenuItemPage;
