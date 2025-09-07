import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface RevenueData {
  date: string;
  total_quantity: number;
  total_revenue: number;
  min_day?: string;
  max_day?: string;
}

function RevenuePage() {
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-07-31");
  const [groupBy, setGroupBy] = useState<"day" | "month" | "year">("day");
  const [revenueData, setRevenueData] = useState<RevenueData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchRevenueData = async () => {
    setError(null);
    setRevenueData(null);

    try {
      const data: RevenueData[] = await (
        window as any
      ).electronAPI.getRevenueData({
        start: startDate,
        end: endDate,
        groupBy,
      });

      if (!Array.isArray(data)) {
        throw new Error("Beklenmeyen veri formatı.");
      }

      setRevenueData(data);
    } catch (err: any) {
      setError(err.message || "Veri alınırken hata oluştu.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, []);

  // groupBy değiştiğinde otomatik olarak yeni veri çek
  useEffect(() => {
    if (revenueData) {
      fetchRevenueData();
    }
  }, [groupBy]);

  return (
    <div className="p-6 h-full flex flex-col">
      <button onClick={() => navigate(-1)} className="btn-secondary inline-flex items-center gap-2">
        <ArrowLeftIcon className="h-5 w-5" />
        <span>Geri</span>
      </button>

      <h1 className="text-2xl font-bold text-white mt-4">Gelir Raporu</h1>

      <div className="card p-4 flex flex-wrap items-end gap-4 mt-4">
        <label className="flex flex-col text-white/80">
          <span className="text-sm mb-1">Başlangıç Tarihi</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col text-white/80">
          <span className="text-sm mb-1">Bitiş Tarihi</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input"
          />
        </label>

        <label className="flex flex-col text-white/80">
          <span className="text-sm mb-1">Gösterim</span>
          <select
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value as "day" | "month" | "year");
            }}
            className="input"
          >
            <option value="day">Günlük</option>
            <option value="month">Aylık</option>
            <option value="year">Yıllık</option>
          </select>
        </label>

        <button onClick={fetchRevenueData} className="btn-primary self-start">
          Getir
        </button>
      </div>

      {error && <div className="text-red-400">{error}</div>}
      {!revenueData && !error && <div className="text-white/80">Yükleniyor...</div>}

      {revenueData && (
        <div className="flex-1 min-h-0 mt-4 flex flex-col space-y-4">
          {/* Özet Bilgiler */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-3 text-white">Özet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-300">
                  {revenueData
                    .reduce((sum, row) => sum + row.total_revenue, 0)
                    .toFixed(2)}{" "}
                  ₺
                </div>
                <div className="text-sm text-white/60">Toplam Gelir</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">
                  {revenueData.reduce((sum, row) => sum + row.total_quantity, 0)}
                </div>
                <div className="text-sm text-white/60">Toplam Sipariş</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-300">
                  {revenueData.length}
                </div>
                <div className="text-sm text-white/60">Kayıt Sayısı</div>
              </div>
            </div>
          </div>

          {/* Detaylı Tablo - only this area scrolls */}
          <div className="card flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 font-medium text-white/60">Tarih</th>
                      <th className="px-6 py-3 font-medium text-right text-white/60">Satış Miktarı</th>
                      <th className="px-6 py-3 font-medium text-right text-white/60">Toplam Gelir (₺)</th>
                      <th className="px-6 py-3 font-medium text-right text-white/60">Sipariş Sayısı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-white/80">
                    {revenueData.map((row, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-3">
                          {(() => {
                            if (groupBy === "month") {
                              if (row.min_day && row.max_day) {
                                const date = new Date(row.date + "-01");
                                if (isNaN(date.getTime())) {
                                  return row.date;
                                }
                                const monthName = date.toLocaleDateString("tr-TR", {
                                  month: "long",
                                });
                                const year = date.getFullYear();
                                const minDay = parseInt(row.min_day);
                                const maxDay = parseInt(row.max_day);

                                return `${minDay}-${maxDay} ${monthName} ${year}`;
                              } else {
                                const date = new Date(row.date + "-01");
                                if (isNaN(date.getTime())) {
                                  return row.date;
                                }
                                const monthName = date.toLocaleDateString("tr-TR", {
                                  month: "long",
                                });
                                const year = date.getFullYear();
                                return `${monthName} ${year}`;
                              }
                            } else if (groupBy === "year") {
                              return row.date;
                            } else {
                              const date = new Date(row.date);
                              if (isNaN(date.getTime())) {
                                return row.date;
                              }
                              return date.toLocaleDateString("tr-TR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              });
                            }
                          })()}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-blue-300">
                          {row.total_quantity}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-emerald-300">
                          {row.total_revenue.toFixed(2)}
                        </td>
                        <td className="px-6 py-3 text-right text-purple-300">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {revenueData.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  Seçilen tarih aralığında veri bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenuePage;
