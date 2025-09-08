import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaymentMethod } from '../../shared/types';

interface DebtOrder {
  id: number;
  created_at: string;
  total: number;
  payment_method: PaymentMethod;
  payment_status: 'paid' | 'unpaid' | 'debt';
  paid_amount?: number | null;
  partial_paid?: number | null;
}

const CustomerDebtDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId, customerName } = (location.state || {}) as { customerId: number; customerName: string };
  const [orders, setOrders] = useState<DebtOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [method, setMethod] = useState<PaymentMethod>('kredi-karti');

  const fetchDebts = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await (window as any).electronAPI.getCustomerDebts(customerId);
      setOrders(data);
    } catch (e: any) {
      setError('Borçlar alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, [customerId]);

  const allSelected = useMemo(() => selected.size > 0 && selected.size === orders.length, [selected, orders]);

  const toggle = (id: number) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map(o => o.id)));
    }
  };

  const totalSelected = useMemo(() => {
    return orders
      .filter(o => selected.has(o.id))
      .reduce((sum, o) => sum + (o.total - (o.partial_paid || 0) - (o.paid_amount || 0)), 0);
  }, [orders, selected]);

  const settle = async (ids: number[]) => {
    if (!ids.length) return;
    try {
      await (window as any).electronAPI.settleCustomerDebts({ customerId, orderHistoryIds: ids, method });
      await fetchDebts();
      setSelected(new Set());
      alert('Tahsilat kaydedildi');
    } catch (e) {
      alert('Tahsilat başarısız');
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button className="btn-secondary" onClick={() => navigate(-1)}>Geri</button>
        <h2 className="text-2xl font-bold text-white">Borç Detayları - {customerName || '#' + customerId}</h2>
      </div>

      <div className="card p-4 mb-4 flex items-center gap-3">
        <span className="text-white/80">Ödeme Yöntemi:</span>
        <div className="flex gap-2">
          <button
            type="button"
            className={method === 'nakit' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMethod('nakit')}
          >
            Nakit
          </button>
          <button
            type="button"
            className={method === 'kredi-karti' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMethod('kredi-karti')}
          >
            Kredi Kartı
          </button>
          <button
            type="button"
            className={method === 'ticket' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setMethod('ticket')}
          >
            Ticket
          </button>
        </div>
        <div className="ml-auto text-white">Seçili Toplam: ₺{totalSelected.toFixed(2)}</div>
        <button className="btn-primary" onClick={() => settle(Array.from(selected))} disabled={selected.size === 0}>Seçiliyi Öde</button>
        <button className="btn-success" onClick={() => settle(orders.map(o => o.id))} disabled={orders.length === 0}>Tümünü Öde</button>
      </div>

      <div className="card overflow-hidden flex-1 min-h-0">
        <div className="h-full overflow-y-auto">
          {loading && <div className="p-4 text-white/70">Yükleniyor…</div>}
          {error && <div className="p-4 text-red-400">{error}</div>}
          {!loading && !error && (
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="p-3 text-left text-xs text-white/60"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
                  <th className="p-3 text-left text-xs text-white/60">Tarih</th>
                  <th className="p-3 text-left text-xs text-white/60">Tutar</th>
                  <th className="p-3 text-left text-xs text-white/60">Kısmi Ödeme</th>
                  <th className="p-3 text-left text-xs text-white/60">Kalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                {orders.map(o => {
                  const remaining = o.total - (o.partial_paid || 0) - (o.paid_amount || 0);
                  return (
                    <tr key={o.id} className="hover:bg-white/5">
                      <td className="p-3"><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} /></td>
                      <td className="p-3">{new Date(o.created_at).toLocaleString('tr-TR')}</td>
                      <td className="p-3">₺{o.total.toFixed(2)}</td>
                      <td className="p-3">₺{(o.partial_paid || 0).toFixed(2)}</td>
                      <td className="p-3 font-semibold text-emerald-300">₺{remaining.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-white/60">Borç kaydı yok.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDebtDetailsPage;
