import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";
import { ArrowLeftIcon, CurrencyDollarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { RootState, AppDispatch } from "../store/store";



const DataPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state: RootState) => state.auth);

  if (currentUser?.role !== "manager") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
           <button onClick={() => navigate(-1)} className="btn-secondary inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Geri</span>
          </button>
          <h2 className="text-xl font-semibold text-white mb-2">Erişim Reddedildi</h2>
          <p className="text-white/70">Bu sayfaya erişim için müdür yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="btn-secondary inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Geri</span>
        </button>
        <h1 className="text-2xl font-bold text-white">Veri Paneli</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Geçmiş Siparişler */}
        <button onClick={() => navigate('/past-orders')} className="card p-6 text-left hover:bg-white/10 transition">
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="h-6 w-6 text-blue-300" />
            <span className="text-lg font-medium text-white">Geçmiş Siparişler</span>
          </div>
        </button>

        {/* Ciro Sayfası */}
        <button onClick={() => navigate('/revenue')} className="card p-6 text-left hover:bg-white/10 transition">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="h-6 w-6 text-emerald-300" />
            <span className="text-lg font-medium text-white">Ciro Bilgileri</span>
          </div>
        </button>
      </div>
    </div>
  );
};


export default DataPage;