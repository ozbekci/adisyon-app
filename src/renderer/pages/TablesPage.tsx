import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  fetchTables,
  selectTable,
  updateTableStatus,
} from "../store/slices/tablesSlice";
import { setCurrentTableId } from "../store/slices/ordersSlice";
import { PlusIcon, UsersIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const TablesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tables, loading, selectedTable } = useSelector(
    (state: RootState) => state.tables
  );
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  const handleTableClick = (table: any) => {
    dispatch(selectTable(table));
    if (table.status === "available") {
      dispatch(setCurrentTableId(table.id));
      setShowNewOrderModal(true);
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "ring-1 ring-emerald-400/40 bg-white/5 hover:bg-white/10";
      case "occupied":
        return "ring-1 ring-rose-400/40 bg-white/5 hover:bg-white/10";
      case "reserved":
        return "ring-1 ring-amber-400/40 bg-white/5 hover:bg-white/10";
      case "cleaning":
        return "ring-1 ring-slate-400/40 bg-white/5 hover:bg-white/10";
      default:
        return "ring-1 ring-white/10 bg-white/5 hover:bg-white/10";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Müsait";
      case "occupied":
        return "Dolu";
      case "reserved":
        return "Rezerve";
      case "cleaning":
        return "Temizlik";
      default:
        return "Bilinmiyor";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Masa Düzeni</h2>
            <p className="text-white/70">Masaları seçin ve sipariş alın</p>
          </div>
        </div>
        <button
          onClick={() => {
            console.log("deneme");
            navigate("/table-management");
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Masa Yönetimi</span>
        </button>
      </div>

      {/* Tables Grid - only this area scrolls */}
      <div className="card flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-lg ${getTableStatusColor(
                  table.status
                )} ${
                  selectedTable?.id === table.id ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-white/10 rounded-full shadow">
                    <span className="text-lg font-bold text-white">
                      {table.number}
                    </span>
                  </div>

                  <div className="flex items-center justify-center mb-2 text-white/90">
                    <UsersIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">{table.seats} kişi</span>
                  </div>

                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      table.status === "available"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : table.status === "occupied"
                        ? "bg-rose-500/15 text-rose-300"
                        : table.status === "reserved"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-slate-500/15 text-slate-300"
                    }`}
                  >
                    {getStatusText(table.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend and quick stats fit tighter */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white/80">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-emerald-500/15 border border-emerald-400/40 rounded"></div>
          <span>Müsait</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-rose-500/15 border border-rose-400/40 rounded"></div>
          <span>Dolu</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-amber-500/15 border border-amber-400/40 rounded"></div>
          <span>Rezerve</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-slate-500/15 border border-slate-400/40 rounded"></div>
          <span>Temizlik</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-2xl font-bold text-emerald-400">
            {tables.filter((t) => t.status === "available").length}
          </div>
          <div className="text-sm text-white/70">Müsait Masa</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-rose-400">
            {tables.filter((t) => t.status === "occupied").length}
          </div>
          <div className="text-sm text-white/70">Dolu Masa</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-amber-300">
            {tables.filter((t) => t.status === "reserved").length}
          </div>
          <div className="text-sm text-white/70">Rezerve Masa</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-blue-400">{tables.length}</div>
          <div className="text-sm text-white/70">Toplam Masa</div>
        </div>
      </div>
    </div>
  );
};

export default TablesPage;
