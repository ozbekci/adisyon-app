import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { logout } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { User } from "../../shared/types";

interface HeaderProps {
  currentUser: User | null;
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser, pageTitle }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString("tr-TR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case "manager":
        return "Müdür";
      case "cashier":
        return "Kasiyer";
      case "waiter":
        return "Garson";
      default:
        return role;
    }
  };

  const handleLogout = () => {
    if (confirm("Çıkış yapmak istediğinizden emin misiniz?")) {
      dispatch(logout());
    }
  };

  return (
    <header className="card px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Back button, title, datetime */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
            style={{ marginLeft: "16px", marginRight: "24px" }}
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
            <p className="text-sm text-white/70 mt-1">{getCurrentDateTime()}</p>
          </div>
        </div>

        {/* Right: icons and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-white/60 hover:text-white transition-colors">
            <BellIcon className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="relative">
            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 card py-1 z-10">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-sm font-medium text-white">
                    {currentUser?.fullName}
                  </p>
                  <p className="text-xs text-white/60">{currentUser?.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/5"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-5" onClick={() => setShowUserMenu(false)} />
      )}
    </header>
  );
};

export default Header;
