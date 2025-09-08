import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./store/store";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import CustomerPage from "./pages/CustomerPage";
import TablesPage from "./pages/TablesPage";
import TableManagementPage from "./pages/TableManagementPage";
import MenuPage from "./pages/MenuPage";
import OrdersPage from "./pages/OrdersPage";
import UserManagementPage from "./pages/UserManagementPage";
import OrderTypePage from "./pages/OrderTypePage";
import MenuManagementPage from "./pages/MenuManagementPage";
import CategoryFormPage from "./pages/CategoryFormPage";
import AddMenuItemPage from "./pages/AddMenuItemPage";
import CashPage from "./pages/CashPage";
import DashboardPage from "./pages/DashboardPage";
import DataPage from "./pages/DataPage";
import PastOrdersPage from "./pages/PastOrdersPage";
import TableSelectPage from "./pages/TableSelectPage";
import RevenuePage from "./pages/RevenuePage";
import SettingsPage from "./pages/SettingsPage";
import CustomerDebtDetailsPage from "./pages/CustomerDebtDetailsPage";
import CustomerOrderHistoryPage from "./pages/CustomerOrderHistoryPage";

// Korumalı route component'i
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated, currentUser } = useSelector(
    (state: RootState) => state.auth
  );
  const location = useLocation();

  // Aktif route'a göre başlık belirleme (Header için)
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/main-management")) return "Masa Yönetimi";
    if (path.startsWith("/table-management")) return "Masa Yönetimi";
    if (path.startsWith("/menu")) return "Menü & Ürünler";
    if (path.startsWith("/orders")) return "Sipariş Yönetimi";
    if (path.startsWith("/payments")) return "Kasa & Ödemeler";
    if (path.startsWith("/users")) return "Personel Yönetimi";
    if (path.startsWith("/dashboard")) return "Ana Sayfa";
    if (path.startsWith("/data")) return "Veriler";
    if (path.startsWith("/past-orders")) return "Geçmiş Siparişler";
    return "Adisyon POS";
  };

  // Sidebar'ı göstermeyeceğimiz üst seviye sayfalar
  const hideLayoutPaths = [
    "/login",
    "/dashboard",
    "/data",
    "/past-orders",
    "/cash",
    "/settings",
    "/menu-management",
    "/users",
    "/revenue",
  "/customers",
  "/customers/debts",
  "/customers/history",
    "/add-menu-item", // Yeni ürün ekle: sidebar gizli
    "/add-category", // Yeni kategori ekle: sidebar gizli
    "/edit-category",
  ];
  const hideLayout = hideLayoutPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  // Determine compact sidebar on specific areas
  const compactSidebarPaths = [
    "/table-management",
    "/orders",
    "/main-management",
  ];
  const isCompactSidebar = compactSidebarPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  const MenuPageWrapper = () => {
    const { type } = useParams();
    const orderType = (type as any) || undefined;
    return <MenuPage orderType={orderType as any} />;
  };

  // Scroll politikası: login, dashboard, users, data ve rapor sayfalarında scroll kapalı
  const noScrollPaths = [
    "/login",
    "/dashboard",
    "/users",
    "/data",
    "/past-orders",
    "/revenue",
    "/menu-management",
    "/add-menu-item",
    "/add-category",
    "/main-management", // masa yönetimi: sayfa scroll kapalı
    "/table-management", // masa yönetimi (detay): sayfa scroll kapalı
    "/orders", // sipariş yönetimi: sayfa scroll kapalı
  "/customers", // müşteri yönetimi: sayfa scroll kapalı (iç pencere scroll)
  "/customers/debts",
  "/customers/history",
  ];
  const isNoScroll = noScrollPaths.some((p) => location.pathname.startsWith(p));

  // Body/html overflow'u politika ile senkronize et
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    const value = isNoScroll ? "hidden" : "auto";
    document.body.style.overflow = value;
    document.documentElement.style.overflow = value;
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [isNoScroll, location.pathname]);

  const mainClass = isNoScroll
    ? hideLayout
      ? "flex-1 overflow-hidden p-0"
      : "flex-1 overflow-hidden p-6 glass"
    : hideLayout
    ? "flex-1 overflow-auto p-0"
    : "flex-1 overflow-auto p-6 glass";

  const containerClass = "flex h-screen gap-6";

  return (
    <div className={containerClass}>
      {!hideLayout && (
        <Sidebar userRole={currentUser?.role || "waiter"} compact={isCompactSidebar} />
      )}
      <div className="flex-1 flex flex-col">
        {!hideLayout && (
          <Header currentUser={currentUser} pageTitle={getPageTitle()} />
        )}
        <main className={mainClass}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Navigate to="/dashboard" />
                </PrivateRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <PrivateRoute>
                  <CustomerPage />
                </PrivateRoute>
              }
            ></Route>
            <Route
              path="/customers/debts"
              element={
                <PrivateRoute>
                  <CustomerDebtDetailsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/customers/history"
              element={
                <PrivateRoute>
                  <CustomerOrderHistoryPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/main-management"
              element={
                <PrivateRoute>
                  <TablesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/table-management"
              element={
                <PrivateRoute>
                  <TableManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/menu"
              element={
                <PrivateRoute>
                  <MenuPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <OrdersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <UserManagementPage />
                </PrivateRoute>
              }
            />
            {/* New Order flow */}
            <Route
              path="/orders/new"
              element={
                <PrivateRoute>
                  <OrderTypePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/new/table-select"
              element={
                <PrivateRoute>
                  <TableSelectPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders/new/:type"
              element={
                <PrivateRoute>
                  <MenuPageWrapper />
                </PrivateRoute>
              }
            />
            <Route
              path="/menu-management"
              element={
                <PrivateRoute>
                  <MenuManagementPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-category"
              element={
                <PrivateRoute>
                  <CategoryFormPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/edit-category/:id"
              element={
                <PrivateRoute>
                  <CategoryFormPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/add-menu-item"
              element={
                <PrivateRoute>
                  <AddMenuItemPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/data"
              element={
                <PrivateRoute>
                  <DataPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/revenue"
              element={
                <PrivateRoute>
                  <RevenuePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/past-orders"
              element={
                <PrivateRoute>
                  <PastOrdersPage />
                </PrivateRoute>
              }
            />
                    <Route
                      path="/settings"
                      element={
                        <PrivateRoute>
                          <SettingsPage />
                        </PrivateRoute>
                      }
                    />
            <Route path="/cash/:mode" element={<CashPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
