import React from "react";
import {
  HomeIcon,
  RectangleGroupIcon,
  ClipboardDocumentListIcon,
  QueueListIcon,
  UsersIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface SidebarProps {
  userRole: "manager" | "cashier" | "waiter";
  compact?: boolean;
}

const getAllMenuItems = () => [
  {
    id: "/main-management",
    name: "Masa Durumu",
    icon: RectangleGroupIcon,
    iconColor: "#60a5fa",
    roles: ["manager", "cashier", "waiter"],
  },
  {
    id: "/orders",
    name: "Sipariş Yönetimi",
    icon: QueueListIcon,
    iconColor: "#34d399",
    roles: ["manager", "cashier", "waiter"],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ userRole, compact = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = getAllMenuItems().filter((item) =>
    item.roles.includes(userRole)
  );

  // Keep width and font sizes constant; only adjust paddings when compact
  const widthClass = "w-56";
  const padHeader = compact ? "p-2.5" : "p-3";
  const padSection = compact ? "px-2 py-1.5" : "px-2.5 py-2";
  const navItemPadding = compact ? "px-2 py-1.5" : "px-2.5 py-2";
  const navTextSize = "text-sm";

  return (
    <div className={`${widthClass} h-full flex flex-col card`}>
      {/* Logo */}
      <div className={`${padHeader} border-b border-white/10`}>
        <div className="flex items-center space-x-2">
          <HomeIcon className="h-6 w-6 text-white/80" />
          <h1 className="text-base font-bold text-white">Adisyon POS</h1>
        </div>
        <p className="text-white/60 text-[11px] mt-1">Restaurant Yönetimi</p>
      </div>

      {/* User Role Badge */}
      <div className={`${padSection} border-b border-white/10`}>
        <div className="flex items-center justify-center">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
              userRole === "manager"
                ? "bg-purple-400/20 text-purple-300 border border-purple-400/30"
                : userRole === "cashier"
                ? "bg-blue-400/20 text-blue-300 border border-blue-400/30"
                : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
            }`}
          >
            {userRole === "manager"
              ? "Müdür"
              : userRole === "cashier"
              ? "Kasiyer"
              : "Garson"}
          </span>
        </div>
      </div>

      {/* Back Button */}
      <div className={`${padSection} border-b border-white/10`}>
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full btn-secondary inline-flex items-center gap-2 justify-center text-xs"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span>Geri</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2.5">
        <ul className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={item.id}
                  className={`w-full flex items-center space-x-2.5 ${navItemPadding} rounded-lg transition-all ${
                    isActive
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "hover:bg-white/5"
                  } text-white/80 hover:text-white ${navTextSize}`}
                >
                  <Icon className="h-5 w-5" style={{ color: item.iconColor }} />
                  <span className="font-medium leading-none">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Restaurant Info */}
      <div className={`${padSection} border-t border-white/10 text-xs`}>
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
          <p className="text-sm font-medium text-white">Aktif Restaurant</p>
          <p className="text-[11px] text-white/70">Demo Restaurant</p>
          <div className="mt-2 flex items-center">
            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
            <span className="text-[11px] text-white/70">Çevrimiçi</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
