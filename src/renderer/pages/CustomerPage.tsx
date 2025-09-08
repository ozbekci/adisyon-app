interface CustomerWithDebt {
  id: number;
  customerName: string;
  debt: number;
}
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import React, { useEffect, useState } from "react";
import { data, useNavigate } from "react-router-dom";

interface Customer {
  id: number;
  customerName: string;
  telephoneNumber: string;
  address: string;
}

const CustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDebt, setShowDebt] = useState(false);
  const [customersWithDebt, setCustomersWithDebt] = useState<
    CustomerWithDebt[]
  >([]);
  // Borçlu müşterileri çek
  const fetchCustomersWithDebt = async () => {
    try {
      const data = await (window as any).electronAPI.getCustomersWithDebt();
      setCustomersWithDebt(data);
    } catch (err) {
      console.error("Borçlu müşteriler alınamadı:", err);
    }
  };
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [form, setForm] = useState<Partial<Customer>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');

  // Müşteri listesini çek
  const fetchCustomers = async () => {
    try {
      const data = await (window as any).electronAPI.getCustomers();
      setCustomers(data);
      console.log(data);
    } catch (err) {
      console.error("Müşteriler alınamadı:", err);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (showDebt) {
      fetchCustomersWithDebt();
    }
  }, [showDebt]);

  // Form değişikliği
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Müşteri ekle
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await (window as any).electronAPI.addCustomer({
        customerName: form.customerName,
        address: form.address,
        telephoneNumber: form.telephoneNumber,
      });
      setForm({});
      fetchCustomers();
    } catch (err) {
      alert("Müşteri eklenemedi!");
    }
  };

  // Müşteri düzenle
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await (window as any).electronAPI.updateCustomer(selectedCustomer.id, {
        customerName: form.customerName,
        address: form.address,
        telephoneNumber: form.telephoneNumber,
      });
      setSelectedCustomer(null);
      setForm({});
      setIsEditing(false);
      fetchCustomers();
    } catch (err) {
      alert("Müşteri güncellenemedi!");
    }
  };

  // Düzenleme moduna geç
  const startEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setForm(customer);
    setIsEditing(true);
  };

  // Düzenlemeyi iptal et
  const cancelEdit = () => {
    setSelectedCustomer(null);
    setForm({});
    setIsEditing(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Geri
        </button>
        <h2 className="text-2xl font-bold text-white">Müşteriler</h2>
      </div>

      {/* Üst Kontroller */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button
          className={`btn px-4 py-2 ${
            showDebt ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => setShowDebt(true)}
        >
          Borç
        </button>
        <button
          className={`btn px-4 py-2 ${
            !showDebt ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => setShowDebt(false)}
        >
          Tüm Müşteriler
        </button>
        <div className="relative ml-auto">
          <input
            type="text"
            placeholder="Ara..."
            value={search}
            onChange={(e)=> setSearch(e.target.value)}
            className="input pl-3 pr-8 py-2 w-56"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white/40">⌘K</span>
        </div>
      </div>

      {/* Liste + Form Alanı */}
      <div className="flex-1 min-h-0 flex gap-6">
        {/* Sol: Liste */}
        <div className="flex-1 min-h-0 card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {showDebt ? "Borçlu Müşteriler" : "Müşteri Listesi"}
            </h3>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {showDebt ? (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Ad
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Borç
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/80">
                  {customersWithDebt
                    .filter(c => !search || c.customerName.toLowerCase().includes(search.toLowerCase()))
                    .map((c) => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="p-3">{c.customerName}</td>
                      <td className="p-3 flex items-center gap-3">
                        <span>₺{c.debt.toFixed(2)}</span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/customers/debts', { state: { customerId: c.id, customerName: c.customerName } })}
                        >
                          Borç Detayları
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/customers/history', { state: { customerId: c.id, customerName: c.customerName } })}
                        >
                          Geçmiş Siparişler
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customersWithDebt.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-4 text-center text-white/60">
                        Borcu olan müşteri yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="p-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Ad
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Adres
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Düzenle
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/80">
                  {customers
                    .filter(c => !search || c.customerName.toLowerCase().includes(search.toLowerCase()))
                    .map((c) => (
                    <tr key={c.id} className="hover:bg-white/5">
                      <td className="p-3">{c.customerName}</td>
                      <td className="p-3">{c.telephoneNumber}</td>
                      <td className="p-3">{c.address}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            className="btn btn-secondary px-2 py-1 text-xs"
                            onClick={() => startEdit(c)}
                          >
                            Düzenle
                          </button>
                          <button
                            className="btn btn-primary px-2 py-1 text-xs"
                            onClick={() => navigate('/customers/history', { state: { customerId: c.id, customerName: c.customerName } })}
                          >
                            Geçmiş
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-white/60">
                        Kayıtlı müşteri yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Sağ: Form */}
        <div className="w-80 shrink-0 card p-4 flex flex-col self-start max-h-[620px]">
          <h3 className="text-lg font-semibold text-white mb-4">
            {isEditing ? "Müşteri Düzenle" : "Yeni Müşteri Ekle"}
          </h3>
          <form
            onSubmit={isEditing ? handleEdit : handleAdd}
            className="space-y-3 flex flex-col"
          >
            <input
              type="text"
              name="customerName"
              value={form.customerName || ""}
              onChange={handleChange}
              placeholder="Ad"
              className="input"
              required
            />
            <input
              type="text"
              name="telephoneNumber"
              value={form.telephoneNumber || ""}
              onChange={handleChange}
              placeholder="Telefon"
              className="input"
              required
            />
            <input
              type="text"
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              placeholder="Adres"
              className="input"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary px-4 py-2">
                {isEditing ? "Kaydet" : "Ekle"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  className="btn btn-secondary px-4 py-2"
                  onClick={cancelEdit}
                >
                  İptal
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerPage;
