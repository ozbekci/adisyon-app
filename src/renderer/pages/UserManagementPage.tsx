import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState, AppDispatch } from "../store/store";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  deleteUserHard,
} from "../store/slices/usersSlice";
import { User } from "../../shared/types";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const UserManagementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { users, loading } = useSelector((state: RootState) => state.users);
  const { currentUser } = useSelector((state: RootState) => state.auth);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "waiter" as "manager" | "cashier" | "waiter",
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleCreateUser = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      fullName: "",
      role: "waiter",
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      fullName: user.fullName,
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Update user
      const updateData: Partial<User> = {
        username: formData.username,
        fullName: formData.fullName,
        role: formData.role,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      await dispatch(updateUser({ id: editingUser.id, userData: updateData }));
    } else {
      // Create user
      await dispatch(createUser(formData));
    }

    setShowModal(false);
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
      await dispatch(deleteUser(id));
    }
  };

  const handleDeleteUserHard = async (id: number) => {
    if (confirm("Bu kullanıcı KALICI olarak silinecek. Emin misiniz?")) {
      await dispatch(deleteUserHard(id));
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "manager":
        return "Müdür";
      case "cashier":
        return "Kasiyer";
      case "waiter":
        return "Garson";
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "manager":
        return "bg-purple-400/20 text-purple-300";
      case "cashier":
        return "bg-blue-400/20 text-blue-300";
      case "waiter":
        return "bg-emerald-400/20 text-emerald-300";
      default:
        return "bg-white/10 text-white/80";
    }
  };

  // Only managers can access this page
  if (currentUser?.role !== "manager") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Geri</span>
          </button>
          <h2 className="text-xl font-semibold text-white">Erişim Reddedildi</h2>
          <p className="text-white/70">
            Bu sayfaya erişim için müdür yetkisi gereklidir.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Geri</span>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white">Personel Yönetimi</h2>
            <p className="text-white/60">Sistem kullanıcılarını yönetin</p>
          </div>
        </div>
        <button onClick={handleCreateUser} className="btn-primary inline-flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          <span>Yeni Personel</span>
        </button>
      </div>

      {/* Users Table - only this section scrolls */}
      <div className="flex-1 min-h-0">
        <div className="card flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Son Giriş
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/80">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-white/70" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-white/60">{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                              ? "bg-emerald-400/20 text-emerald-300"
                              : "bg-rose-400/20 text-rose-300"
                          }`}
                        >
                          {user.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {user.lastLogin
                          ? new Date(user.lastLogin).toLocaleDateString("tr-TR")
                          : "Hiç giriş yapmadı"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-300 hover:text-blue-200"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser?.id && (
                            <>
                              <button
                                title="Pasif Yap"
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-amber-300 hover:text-amber-200"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                              <button
                                title="Kalıcı Sil"
                                onClick={() => handleDeleteUserHard(user.id)}
                                className="text-rose-300 hover:text-rose-200"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 w-96">
            <div className="card p-5">
              <h3 className="text-lg font-medium text-white mb-4">
                {editingUser ? "Personel Düzenle" : "Yeni Personel Ekle"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80">
                    Kullanıcı Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="mt-1 input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80">
                    {editingUser
                      ? "Yeni Şifre (boş bırakılırsa değişmez)"
                      : "Şifre"}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="mt-1 input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80">
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="mt-1 input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80">
                    Rol
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as any })
                    }
                    className="mt-1 input w-full"
                  >
                    <option value="waiter">Garson</option>
                    <option value="cashier">Kasiyer</option>
                    <option value="manager">Müdür</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    İptal
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? "Güncelle" : "Oluştur"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
