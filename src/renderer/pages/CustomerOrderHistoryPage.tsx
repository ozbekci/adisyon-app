import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HistoryOrderItem { quantity: number; name?: string; price: number; }
interface HistoryOrder {
  id: number;
  customer_id: number | null;
  customer_name?: string | null;
  total: number;
  payment_method?: string | null;
  payment_status?: string | null;
  created_at: string; // this is COALESCE(paid_at, created_at)
  items?: HistoryOrderItem[];
}

const CustomerOrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId, customerName } = (location.state || {}) as { customerId?: number; customerName?: string };
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(customerId ?? '');

  const fetchHistory = async (cid?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await (window as any).electronAPI.getCustomerOrderHistory(cid);
      setOrders(data);
    } catch (e) {
      setError('Geçmiş siparişler alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(customerId); }, [customerId]);

  const totalSum = useMemo(() => orders.reduce((s, o) => s + (o.total || 0), 0), [orders]);

  const loadAll = () => { setSelectedCustomerId(''); fetchHistory(undefined); };
  const applyFilter = () => { if (selectedCustomerId) fetchHistory(Number(selectedCustomerId)); };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn-secondary" onClick={() => navigate(-1)}>Geri</button>
        <h2 className="text-2xl font-bold text-white">Müşteri Geçmiş Siparişleri{customerName ? ` - ${customerName}` : ''}</h2>
      </div>

      <div className="card p-4 mb-4 flex items-center gap-3">
        <input
          type="number"
          placeholder="Müşteri ID"
          value={selectedCustomerId}
          onChange={e => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
          className="input w-40"
        />
        <button className="btn-primary" onClick={applyFilter} disabled={!selectedCustomerId}>Filtrele</button>
        <button className="btn-secondary" onClick={loadAll}>Tümü</button>
        <div className="ml-auto text-white">Toplam: ₺{totalSum.toFixed(2)}</div>
      </div>

      <div className="card overflow-hidden flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          {loading && <div className="p-4 text-white/70">Yükleniyor…</div>}
          {error && <div className="p-4 text-red-400">{error}</div>}
          {!loading && !error && (
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-left text-xs text-white/60">Tarih</th>
                  <th className="p-3 text-left text-xs text-white/60">Müşteri</th>
                  <th className="p-3 text-left text-xs text-white/60">Tutar</th>
                  <th className="p-3 text-left text-xs text-white/60">Ödeme</th>
                  <th className="p-3 text-left text-xs text-white/60">Ürünler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-white/5">
                    <td className="p-3">{new Date(o.created_at).toLocaleString('tr-TR')}</td>
                    <td className="p-3">{o.customer_name || (o.customer_id != null ? `#${o.customer_id}` : '—')}</td>
                    <td className="p-3">₺{(o.total || 0).toFixed(2)}</td>
                    <td className="p-3">{o.payment_method || '-'}</td>
                    <td className="p-3 text-xs">
                      {o.items && o.items.length > 0 ? o.items.slice(0, 3).map((it, idx) => (
                        <span key={idx} className="mr-2">{it.quantity}x {it.name}</span>
                      )) : '—'}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-white/60">Kayıt yok.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOrderHistoryPage;
