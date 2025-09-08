import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { fetchPastOrders } from "../store/slices/pastOrdersSlice";
import { fetchProductSales } from "../store/slices/productSalesSlice";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Order } from "../../shared/types";

const PastOrdersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { pastOrders, loading, error } = useSelector(
    (state: RootState) => state.pastOrders
  );
  const { sales, loading: salesLoading } = useSelector(
    (state: RootState) => state.productSales
  );
  const [tab, setTab] = React.useState<"orders" | "products">("orders");
  const [orderBy, setOrderBy] = React.useState<"quantity" | "revenue">(
    "revenue"
  );
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const navigate = useNavigate();
  // Only display orders that are not marked as debt (borc)
  const filteredPastOrders = (pastOrders || []).filter(
    (o) => o.payment_method !== "borc"
  );

  // Daha canlı ödeme yöntemi rozet sınıfları
  const getPaymentBadgeClasses = (method?: Order["payment_method"]) => {
    const base =
      "inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full ring-1 shadow-sm";
    switch (method) {
      case "nakit":
        return `${base} bg-emerald-500/30 text-emerald-100 ring-emerald-400/40`;
      case "kredi-karti":
        return `${base} bg-blue-500/30 text-blue-100 ring-blue-400/40`;
      case "ticket":
        return `${base} bg-purple-500/30 text-purple-100 ring-purple-400/40`;
      case "partial-payment":
        return `${base} bg-orange-500/30 text-orange-100 ring-orange-400/40`;
      default:
        return `${base} bg-white/15 text-white ring-white/20`;
    }
  };

  useEffect(() => {
    if (tab === "orders") {
      dispatch(fetchPastOrders());
    } else {
      dispatch(fetchProductSales({ start: startDate, end: endDate, orderBy }));
    }
  }, [dispatch, tab, orderBy, startDate, endDate]);

  // Console'a pastOrders verilerini yazdır

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Geri</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Geçmiş Siparişler</h1>
      </div>
      {loading && <p className="text-white/80">Yükleniyor...</p>}
      {error && <p className="text-red-400">{error}</p>}
      {/* Tabs */}
      <div className="mb-4 space-x-3">
        <button
          onClick={() => setTab("orders")}
          className={tab === "orders" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
        >
          {tab === "orders" && <CheckIcon className="h-4 w-4 mr-1 inline" />}Sipariş
          Bazlı
        </button>
        <button
          onClick={() => setTab("products")}
          className={tab === "products" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
        >
          {tab === "products" && <CheckIcon className="h-4 w-4 mr-1 inline" />}Ürün
          Bazlı
        </button>
      </div>

      {tab === "orders" && !loading && !error && (
        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {/* Özet Kartları */}
          {filteredPastOrders && filteredPastOrders.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-4">
                <div className="text-2xl font-bold text-blue-300">
                  {filteredPastOrders.length}
                </div>
                <div className="text-sm text-white/60">Toplam Sipariş</div>
              </div>
              <div className="card p-4">
                <div className="text-2xl font-bold text-emerald-300">
                  {filteredPastOrders
                    .reduce((sum, order) => sum + (order.total || 0), 0)
                    .toFixed(2)}{" "}
                  ₺
                </div>
                <div className="text-sm text-white/60">Toplam Ciro</div>
              </div>
              <div className="card p-4">
                <div className="text-2xl font-bold text-purple-300">
                  {filteredPastOrders.reduce(
                    (sum, order) => sum + (order.items?.length || 0),
                    0
                  )}
                </div>
                <div className="text-sm text-white/60">Toplam Ürün</div>
              </div>
              <div className="card p-4">
                <div className="text-2xl font-bold text-orange-300">
                  {filteredPastOrders.length > 0
                    ? (
                        filteredPastOrders.reduce(
                          (sum, order) => sum + (order.total || 0),
                          0
                        ) / filteredPastOrders.length
                      ).toFixed(2)
                    : "0.00"}{" "}
                  ₺
                </div>
                <div className="text-sm text-white/60">Ortalama Sipariş</div>
              </div>
            </div>
          )}

          {/* Sipariş Tablosu - sadece bu bölüm dikey scroll */}
          <div className="card flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                        Sipariş No
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                        Masa / Müşteri
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                        Ürünler
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                        Tutar
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                        Tamamlanma Tarihi
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                        Ödeme Yöntemi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    {[...filteredPastOrders]
                      .sort(
                        (a, b) =>
                          new Date(b.created_at || b.updatedAt).getTime() -
                          new Date(a.created_at || a.updatedAt).getTime()
                      )
                      .map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-medium text-white text-center">
                              #{order.id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-white text-center">
                              {order.table_number
                                ? `Masa ${order.table_number}`
                                : order.customer_name || "Paket"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm text-white text-center">
                              {order.items && order.items.length > 0 ? (
                                <div className="space-y-1 text-center">
                                  {order.items.slice(0, 2).map((item, idx) => (
                                    <div key={idx} className="text-xs text-center text-white/80">
                                      {item.quantity}x {item.name}
                                    </div>
                                  ))}
                                  {order.items.length > 2 && (
                                    <div className="text-xs text-white/60 text-center">
                                      +{order.items.length - 2} ürün daha
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-white/60 text-center">
                                  Ürün detayı yok
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm font-semibold text-emerald-300 text-center">
                              {(order.total || 0).toFixed(2)} ₺
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="text-sm text-white text-center">
                              {(() => {
                                const dateStr =
                                  order.created_at || order.updatedAt;
                                if (!dateStr) return "-";
                                const dateObj = new Date(dateStr);
                                if (isNaN(dateObj.getTime())) return "Geçersiz Tarih";
                                return dateObj.toLocaleDateString("tr-TR", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                });
                              })()}
                            </div>
                            <div className="text-xs text-white/60 text-center">
                              {(() => {
                                const dateStr =
                                  order.created_at || order.updatedAt;
                                if (!dateStr) return "-";
                                const dateObj = new Date(dateStr);
                                if (isNaN(dateObj.getTime())) return "Geçersiz Saat";
                                return dateObj.toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                });
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={getPaymentBadgeClasses(order.payment_method)}>
                              {order.payment_method === "nakit"
                                ? "Nakit"
                                : order.payment_method === "kredi-karti"
                                ? "Kredi Kartı"
                                : order.payment_method === "ticket"
                                ? "Ticket"
                                : order.payment_method === "borc"
                                ? "Borç"
                                : order.payment_method === "partial-payment"
                                ? order.partialPayments && order.partialPayments.length > 0
                                  ? order.partialPayments.reduce((acc: string, payment: { cash: number; credit_kart: number; ticket: number }) => {
                                      const parts: string[] = [];
                                      if (payment.cash > 0) parts.push(`${payment.cash} ₺ nakit`);
                                      if (payment.credit_kart > 0) parts.push(`${payment.credit_kart} ₺ kredi`);
                                      if (payment.ticket > 0) parts.push(`${payment.ticket} ₺ ticket`);
                                      return parts.join(' + ');
                                    }, "")
                                  : "Kısmi Ödeme"
                                : "Bilinmiyor"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>

                {(!filteredPastOrders || filteredPastOrders.length === 0) && (
                  <div className="text-center py-12">
                    <div className="text-white/70 text-lg mb-2">
                      Henüz tamamlanmış sipariş yok
                    </div>
                    <div className="text-white/60 text-sm">
                      Ödenen siparişler burada görünecek
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="space-y-4">
          {/* Filtre Kontrolleri */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-white/80">
                  Başlangıç:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input px-3 py-1 text-sm"
                />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-white/80">
                  Bitiş:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input px-3 py-1 text-sm"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  className={(!startDate && !endDate) ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                >
                  {!startDate && !endDate && (
                    <CheckIcon className="h-4 w-4 mr-1 inline" />
                  )}
                  Tüm Zamanlar
                </button>

                <button
                  className={(startDate === new Date().toISOString().slice(0, 10) && endDate === startDate) ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setStartDate(today);
                    setEndDate(today);
                  }}
                >
                  {startDate === new Date().toISOString().slice(0, 10) &&
                    endDate === startDate && (
                      <CheckIcon className="h-4 w-4 mr-1 inline" />
                    )}
                  Bugün
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  className={orderBy === "quantity" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                  onClick={() => setOrderBy("quantity")}
                >
                  {orderBy === "quantity" && (
                    <CheckIcon className="h-4 w-4 mr-1 inline" />
                  )}
                  Adede Göre
                </button>

                <button
                  className={orderBy === "revenue" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                  onClick={() => setOrderBy("revenue")}
                >
                  {orderBy === "revenue" && (
                    <CheckIcon className="h-4 w-4 mr-1 inline" />
                  )}
                  Ciroya Göre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "products" && !salesLoading && (
        <div className="card overflow-hidden">
          {/* Ürün Satış Özeti */}
          <div className="p-4 bg-white/5 border-b border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">
                  {sales.length}
                </div>
                <div className="text-sm text-white/60">Farklı Ürün</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">
                  {sales.reduce((sum, s) => sum + s.total_quantity, 0)}
                </div>
                <div className="text-sm text-white/60">Toplam Adet</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">
                  {sales
                    .reduce((sum, s) => sum + Number(s.total_revenue), 0)
                    .toFixed(2)}{" "}
                  ₺
                </div>
                <div className="text-sm text-white/60">Toplam Ciro</div>
              </div>
            </div>
          </div>

          {/* Ürün Tablosu */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Sıra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Ürün Adı
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                    Satış Adedi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                    Toplam Ciro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                    Ortalama Fiyat
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                    Performans
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-white/80">
                {sales.map((s, index) => {
                  const avgPrice =
                    s.total_quantity > 0
                      ? Number(s.total_revenue) / s.total_quantity
                      : 0;
                  const maxRevenue = Math.max(
                    ...sales.map((item) => Number(item.total_revenue))
                  );
                  const performancePercent =
                    maxRevenue > 0
                      ? (Number(s.total_revenue) / maxRevenue) * 100
                      : 0;

                  return (
                    <tr key={s.menu_item_id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            index === 0
                              ? "bg-yellow-400/20 text-yellow-300"
                              : index === 1
                              ? "bg-white/10 text-white/80"
                              : index === 2
                              ? "bg-orange-400/20 text-orange-300"
                              : "bg-blue-400/20 text-blue-300"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          {s.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-blue-300">
                          {s.total_quantity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-emerald-300">
                          {Number(s.total_revenue).toFixed(2)} ₺
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-white">
                          {avgPrice.toFixed(2)} ₺
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <div className="w-full bg-white/10 rounded-full h-2 max-w-16">
                            <div
                              className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${performancePercent}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs text-white/60 min-w-12">
                            {performancePercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {sales.length === 0 && (
              <div className="text-center py-12">
                <div className="text-white/70 text-lg mb-2">
                  Seçilen dönemde satış yok
                </div>
                <div className="text-white/60 text-sm">
                  Farklı tarih aralığı seçmeyi deneyin
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PastOrdersPage;
