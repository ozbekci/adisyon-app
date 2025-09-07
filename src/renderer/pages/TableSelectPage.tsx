import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { fetchTables } from "../store/slices/tablesSlice";
import { setCurrentTable } from "../store/slices/ordersSlice";
import { useNavigate } from "react-router-dom";
import { UsersIcon } from "@heroicons/react/24/outline";

const TableSelectPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tables, loading } = useSelector((state: RootState) => state.tables);

  useEffect(() => {
    dispatch(fetchTables());
  }, [dispatch]);

  const handleSelect = (table: any) => {
    if (table.status !== "available") return;
    dispatch(setCurrentTable(table));
    navigate("/orders/new/dine-in");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-2xl font-semibold mb-6 text-white">Masa Seç</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => (
          <button
            key={table.id}
            onClick={() => handleSelect(table)}
            className={
              `p-4 rounded-lg transition-all duration-200 hover:shadow-lg flex flex-col items-center card ` +
              (table.status === "available"
                ? "hover:bg-white/10"
                : "opacity-60 cursor-not-allowed")
            }
            disabled={table.status !== "available"}
          >
            <div className="flex items-center justify-center w-12 h-12 mb-2 bg-white/10 rounded-full">
              <span className="text-lg font-bold text-white">
                {table.number}
              </span>
            </div>
            <div className="flex items-center text-white/80 text-sm">
              <UsersIcon className="h-4 w-4 mr-1" />
              {table.seats} kişi
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TableSelectPage;
