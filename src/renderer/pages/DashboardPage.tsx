import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { logout } from "../store/slices/authSlice";
import {
  TableCellsIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  Cog6ToothIcon,
  CurrencyDollarIcon,
  UsersIcon,
  QueueListIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface CardItem {
  id: string;
  name: string;
  icon: any;
  color: string;
  roles?: string[]; // future use
}

const cards: CardItem[] = [
  {
    id: "/main-management",
    name: "Masa Durumu",
    icon: TableCellsIcon,
    color: "bg-blue-600",
  },

  {
    id: "/menu",
    name: "Menü & Ürünler",
    icon: ClipboardDocumentListIcon,
    color: "bg-indigo-600",
  },
  {
    id: "/orders",
    name: "Sipariş Yönetimi",
    icon: Bars3Icon,
    color: "bg-orange-600",
  },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser } = useSelector((state: RootState) => state.auth);
  const [showUserMenu, setShowUserMenu] = useState(false);
  // null means "loading"; once fetched, it becomes an object
  const [cashStatus, setCashStatus] = useState<{
    isOpen: boolean;
    session?: any;
  } | null>(null);

  const getRoleText = (role: string) => {
    switch (role) {
      case "manager":
        return "Yönetici";
      case "cashier":
        return "Kasiyer";
      case "waiter":
        return "Garson";
      default:
        return "Kullanıcı";
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleUserChange = () => {
    dispatch(logout());
    navigate("/login");
  };

  useEffect(() => {
    // Kasa durumunu kontrol et
    const checkCashStatus = async () => {
      try {
        const status = await (window as any).electronAPI.getCashStatus();
        setCashStatus(status);
      } catch (error) {
        console.error("Kasa durumu alınırken hata:", error);
      }
    };

    checkCashStatus();

    // Periyodik olarak kasa durumunu kontrol et
    const interval = setInterval(checkCashStatus, 2000);

    // Window focus olduğunda da kontrol et
    const handleFocus = () => {
      checkCashStatus();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest(".relative")) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  useEffect(() => {
    // Dashboard açıkken global scroll'u kapat
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  const handleCashToggle = async () => {
    try {
      if (cashStatus?.isOpen) {
        // Kasa açık, kapat
        await (window as any).electronAPI.openCashWindow("close");
      } else {
        // Kasa kapalı, aç
        await (window as any).electronAPI.openCashWindow("open");
      }

      // Kısa bir bekleme sonrası durum güncellemesi
      setTimeout(async () => {
        try {
          const newStatus = await (window as any).electronAPI.getCashStatus();
          setCashStatus(newStatus);
        } catch (error) {
          console.error("Kasa durumu güncellenirken hata:", error);
        }
      }, 500);
    } catch (error) {
      console.error("Kasa işlemi sırasında hata:", error);
    }
  };

  const handleMainManagementClick = () => {
    if (!cashStatus?.isOpen) {
      alert(
        "Kasa kapalı! Masa ve sipariş yönetimine girmek için önce kasayı açmanız gerekiyor."
      );
      return;
    }
    navigate("/main-management");
  };

  return (
    <div
      className="h-full overflow-hidden relative p-6"
      style={{ position: "relative" }}
    >
      {/* Kasa Durumu ve Ayarlar Butonları - Sağ Üst */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Settings button - visible only to managers */}
          {currentUser?.role === "manager" && (
            <button
              onClick={() => navigate("/settings")}
              title="Ayarlar"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                color: "white",
                padding: "8px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "40px",
                height: "40px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Cog6ToothIcon style={{ width: "18px", height: "18px" }} />
            </button>
          )}

          {/* Cash status button: show neutral while loading to avoid false "Kapalı" flash */}
          <button
            onClick={handleCashToggle}
            style={{
              backgroundColor:
                cashStatus === null ? "#4b5563" : cashStatus.isOpen ? "#16a34a" : "#dc2626",
              color: "white",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
              transition: cashStatus === null ? "none" : "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (cashStatus === null) return;
              e.currentTarget.style.backgroundColor = cashStatus.isOpen ? "#15803d" : "#b91c1c";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              if (cashStatus === null) return;
              e.currentTarget.style.backgroundColor = cashStatus.isOpen ? "#16a34a" : "#dc2626";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <CurrencyDollarIcon style={{ width: "16px", height: "16px" }} />
            <span>
              {cashStatus === null ? "Kasa Durumu Yükleniyor..." : cashStatus.isOpen ? "Kasa Açık" : "Kasa Kapalı"}
            </span>
          </button>
        </div>
      </div>
      {/* Dropdown Menu */}
      {showUserMenu && (
        <div
          style={{
            position: "absolute",
            bottom: "160px",
            left: "16px",
            zIndex: 1000,
            maxHeight: "calc(100vh - 160px)",
            overflowY: "auto",
          }}
          className="w-56 card py-2"
        >
          <div className="px-4 py-2 border-b border-white/10">
            <p className="text-sm font-medium text-white">
              {currentUser?.fullName}
            </p>
            <p className="text-xs text-white/60">
              {getRoleText(currentUser?.role || "")}
            </p>
          </div>

          <button
            onClick={handleUserChange}
            className="w-full flex items-center px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors"
          >
            <UserIcon className="h-4 w-4 mr-3" />
            Kullanıcı Değiştir
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-rose-300 hover:bg-rose-400/10 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
            Çıkış Yap
          </button>
        </div>
      )}
      {/* Kullanıcı Menu Butonu - Sol Alt */}
      <div
        className="relative overflow-visible"
        style={{
          position: "absolute",
          bottom: "80px",
          left: "16px",
          zIndex: 1000,
        }}
      >
        <div className="relative overflow-visible">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 rounded-lg p-3 transition-colors shadow-md card hover:bg-white/10"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-white">
                {currentUser?.fullName}
              </p>
              <p className="text-xs text-white/60">
                {getRoleText(currentUser?.role || "")}
              </p>
            </div>
            <UserCircleIcon className="h-8 w-8 text-white/60" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col justify-center h-full">
        <h1 className="text-3xl font-bold text-white mb-4 text-center">
          Hoş Geldiniz
        </h1>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={handleMainManagementClick}
            className={`btn px-5 py-4 text-lg shadow-lg transition-transform ${
              cashStatus?.isOpen
                ? "btn-primary hover:scale-105"
                : "bg-white/5 text-white/40 cursor-not-allowed hover:scale-100"
            }`}
            style={{ opacity: cashStatus?.isOpen ? 1 : 0.6 }}
          >
            Masa • Sipariş Yönetimi
          </button>
          <button
            onClick={() => navigate("/data")}
            className="btn btn-primary px-5 py-4 text-lg shadow-lg hover:scale-105 transition-transform"
          >
            Veriler
          </button>
        </div>

        {/* Ek Yönetim Butonları */}
        <div className="flex flex-col sm:flex-row items-center justify-center mt-4 space-y-2 sm:space-y-0 sm:space-x-2">
          <button
            onClick={() => navigate("/menu-management")}
            className="btn btn-primary px-5 py-4 text-lg shadow-lg hover:scale-105 transition-transform"
          >
            <ClipboardDocumentListIcon style={{ width: "20px", height: "20px" }} />
            <span>Menü & Ürünler</span>
          </button>
          <button
            onClick={() => navigate("/users")}
            className="btn btn-primary px-5 py-4 text-lg shadow-lg hover:scale-105 transition-transform"
          >
            <UsersIcon style={{ width: "20px", height: "20px" }} />
            <span>Personel Yönetimi</span>
          </button>
          <button
            onClick={() => navigate("/customers")}
            className="btn btn-primary px-5 py-4 text-lg shadow-lg hover:scale-105 transition-transform"
          >
            <QueueListIcon style={{ width: "20px", height: "20px" }} />
            <span>Müşteriler</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
