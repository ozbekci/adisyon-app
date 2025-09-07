import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpTrayIcon,
  TableCellsIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const OrderTypePage: React.FC = () => {
  const navigate = useNavigate();
  const orderTypes = [
    {
      id: "takeaway",
      title: "Al Götür",
      description: "Müşteri siparişi alıp götürecek",
      icon: ArrowUpTrayIcon,
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      id: "dine-in",
      title: "Masa",
      description: "Masada yemek servis edilecek",
      icon: TableCellsIcon,
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
    {
      id: "delivery",
      title: "Paket",
      description: "Sipariş paketlenip gönderilecek",
      icon: ShoppingBagIcon,
      color: "from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700",
    },
  ];

  const handleOrderTypeSelect = (type: "takeaway" | "dine-in" | "delivery") => {
    if (type === "dine-in") {
      navigate("/orders/new/table-select");
    } else {
      navigate(`/orders/new/${type}`);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-full p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBackToDashboard}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Ana Menü</span>
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-3">
            🆕 Yeni Sipariş - Sipariş Türü Seçin
          </h1>
          <p className="text-lg text-white/70">Nasıl bir sipariş almak istiyorsunuz?</p>
        </div>
      </div>

      {/* Order Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {orderTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => handleOrderTypeSelect(type.id as any)}
              className={`
                  bg-gradient-to-br ${type.color} ${type.hoverColor}
                  p-6 rounded-xl text-white 
                  transform transition-all duration-300 
                  hover:scale-105 hover:shadow-xl
                  focus:outline-none focus:ring-4 focus:ring-white/20
                  active:scale-95
                  min-h-[200px] flex flex-col justify-center
                `}
            >
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <IconComponent className="w-12 h-12" />
                </div>
                <h2 className="text-xl font-bold mb-3">{type.title}</h2>
                <p className="text-sm opacity-90 leading-relaxed">
                  {type.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="mt-10 card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-blue-300 mb-2">
              <ArrowUpTrayIcon className="w-6 h-6 mx-auto" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-sm">Al Götür</h3>
            <p className="text-white/70 text-xs">
              Hızlı sipariş alma, müşteri beklemeden alıp gidiyor
            </p>
          </div>
          <div>
            <div className="text-emerald-300 mb-2">
              <TableCellsIcon className="w-6 h-6 mx-auto" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-sm">Masa Servisi</h3>
            <p className="text-white/70 text-xs">Masaya sipariş alınıyor, servis yapılacak</p>
          </div>
          <div>
            <div className="text-orange-300 mb-2">
              <ShoppingBagIcon className="w-6 h-6 mx-auto" />
            </div>
            <h3 className="font-semibold text-white mb-2 text-sm">Paket Servis</h3>
            <p className="text-white/70 text-xs">Sipariş hazırlanıp paketlenip gönderilecek</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTypePage;
