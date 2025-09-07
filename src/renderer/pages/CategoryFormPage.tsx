import React, { useEffect, useState } from "react";
import { ArrowLeftIcon, CheckIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useNavigate, useParams } from "react-router-dom";

interface CategoryForm {
  name: string;
  description: string;
  color: string;
}

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

const CategoryFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const categoryId = isEditMode ? parseInt(id as string, 10) : null;

  const [formData, setFormData] = useState<CategoryForm>({
    name: "",
    description: "",
    color: "#6B7280",
  });
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // fetch data if edit
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode || !categoryId) return;
      try {
        const categories = await (window as any).electronAPI.getMenuCategories();
        const cat = categories.find((c: any) => c.id === categoryId);
        if (!cat) {
          setError("Kategori bulunamadı");
          return;
        }
        setFormData({
          name: cat.name,
          description: cat.description,
          color: cat.color || "#6B7280",
        });
      } catch (err) {
        console.error(err);
        setError("Kategori yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isEditMode, categoryId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (hex: string) => {
    setFormData((prev) => ({ ...prev, color: hex }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Kategori adı gereklidir");
      return;
    }
    setSaving(true);
    try {
      if (isEditMode && categoryId) {
        await (window as any).electronAPI.updateMenuCategory(categoryId, {
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
        });
      } else {
        await (window as any).electronAPI.createMenuCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          color: formData.color,
          isActive: true,
        });
      }
      navigate("/menu-management");
    } catch (err) {
      console.error(err);
      setError("Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-2 border-white/30 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" /> Geri Dön
        </button>
        <h1 className="text-2xl font-bold text-white">
          {isEditMode ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-2xl">
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kategori Adı *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            {/* Desc */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Açıklama
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="input"
              />
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Kategori Rengi
              </label>
              <div className="flex flex-wrap gap-2 mb-4 w-fit">
                {predefinedColors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleColorSelect(c.value)}
                    className={`inline-flex p-4 items-center justify-center w-10 h-5 flex-shrink-0 rounded-lg border-2 transition-all hover:scale-105 ${
                      formData.color === c.value
                        ? "border-white ring-2 ring-white/40"
                        : "border-white/20"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  >
                    {formData.color === c.value && (
                      <CheckIcon className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-white/70">
                  Renk Paletinden Seçiniz:
                </span>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-8 h-8 rounded border border-white/20 bg-white/10"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                <p className="text-rose-300 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    {!isEditMode && (
                      <PlusIcon className="h-4 w-4 mr-2" />
                    )}{" "}
                    {isEditMode ? "Güncelle" : "Ekle"}
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

export default CategoryFormPage;