import React, { useEffect, useState } from "react";
import { PaymentMethod } from "../../shared/types";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchMenuItems, selectCategory } from "../store/slices/menuSlice";
import { addToCurrentOrder } from "../store/slices/ordersSlice";
import { createOrder, clearCurrentOrder } from "../store/slices/ordersSlice";
import { PlusIcon, MinusIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import AdminPasswordModal from "../components/AdminPasswordModal";
import PaymentModal from "../components/PaymentModal";
import { useNavigate } from "react-router-dom";

interface MenuPageProps {
  orderType?: "takeaway" | "dine-in" | "delivery" | null;
  onAdminClick?: () => void;
  onMenuManagementClick?: () => void;
}

const MenuPage: React.FC<MenuPageProps> = ({ orderType, onAdminClick, onMenuManagementClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { items, categories, loading, selectedCategory } = useSelector((state: RootState) => state.menu);
  const { currentOrder, currentTableId, currentTable } = useSelector((state: RootState) => state.orders);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  const filteredItems = selectedCategory ? items.filter((item) => item.category === selectedCategory) : items;

  const handleQuantityChange = (itemId: number, delta: number) => {
    const newQuantity = Math.max(0, (quantities[itemId] || 0) + delta);
    setQuantities((prev) => ({ ...prev, [itemId]: newQuantity }));
  };

  const handleAddToOrder = (menuItem: any) => {
    const quantity = quantities[menuItem.id] || 1;
    if (quantity > 0) {
      dispatch(addToCurrentOrder({ menuItem, quantity, notes: "" }));
      setQuantities((prev) => ({ ...prev, [menuItem.id]: 0 }));
    }
  };

  const getTotalOrderValue = () => currentOrder.reduce((total, item) => total + item.price * item.quantity, 0);

  const handleAdminClick = () => setShowAdminModal(true);
  const handleAdminSuccess = () => {
    setShowAdminModal(false);
    onAdminClick?.();
  };
  const handleMenuManagementClick = () => onMenuManagementClick?.();

  const handleOrderSubmit = async () => {
    if (orderType === "dine-in" && !currentTableId) {
      alert("Lütfen masa seçin.");
      return;
    }
    if (currentOrder.length === 0) {
      alert("Lütfen en az bir ürün ekleyin.");
      return;
    }
    try {
      const payload: any = { items: currentOrder, orderType };
      if (orderType === "dine-in") payload.tableId = currentTableId;
      await dispatch(createOrder(payload));
      setQuantities({});
      dispatch(clearCurrentOrder());
      alert("Sipariş başarıyla kaydedildi!");
      navigate("/orders");
    } catch (error) {
      alert("Sipariş kaydedilemedi!");
      console.error(error);
    }
  };

  const handlePaymentSubmit = (paymentMethod: string, customerId?: number) => {
    const payload: any = { items: currentOrder, orderType, paymentMethod, isPaid: true, customerId: null };
    if (paymentMethod === "borc") payload.customerId = customerId ?? null;
    if (orderType === "dine-in") payload.tableId = currentTableId;
    dispatch(createOrder(payload));
    setQuantities({});
    dispatch(clearCurrentOrder());
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    alert("Ödeme başarıyla alındı!");
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-white/20 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex gap-6 min-h-0">
      {showAdminModal && (
        <AdminPasswordModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminSuccess}
        />
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        onPaymentSubmit={handlePaymentSubmit}
  selectedPaymentMethod={selectedPaymentMethod}
  onPaymentMethodSelect={(m) => setSelectedPaymentMethod(m)}
        totalAmount={getTotalOrderValue()}
        orderItems={currentOrder}
        orderInfo={currentTable ? { tableNumber: currentTable.number } : undefined}
      />

      {/* Left: Menu */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Order type banner */}
        {orderType && (
          <div className="mb-4 card">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white">
                {orderType === "takeaway"
                  ? "📦 Al Götür Sipariş"
                  : orderType === "delivery"
                  ? "🚚 Paket Sipariş"
                  : "🍽️ Masa Sipariş"}
              </h2>
              <p className="text-white/70 text-sm">
                {orderType === "takeaway"
                  ? "Müşteri siparişi alıp götürecek"
                  : orderType === "delivery"
                  ? "Sipariş paketlenip gönderilecek"
                  : "Masaya servis yapılacak"}
              </p>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => dispatch(selectCategory(null))}
                className={`px-4 py-2 rounded-full border transition ${
                  !selectedCategory ? "bg-white/20 text-white border-white/30" : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                }`}
              >
                Tümü
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => dispatch(selectCategory(category))}
                  className={`px-4 py-2 rounded-full border transition ${
                    selectedCategory === category
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="card">
                {/* Image */}
                <div className="h-36 bg-white/10 flex items-center justify-center text-white/70">Fotoğraf</div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                  {item.description && <p className="text-sm text-white/70 mb-2 max-h-10 overflow-hidden">{item.description}</p>}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-emerald-400">₺{item.price.toFixed(2)}</span>
                    <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">{item.category}</span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!quantities[item.id]}
                    >
                      <MinusIcon className="h-4 w-4 text-white" />
                    </button>
                    <span className="w-8 text-center font-medium text-white">{quantities[item.id] || 0}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/15"
                    >
                      <PlusIcon className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleAddToOrder(item)}
                    disabled={!quantities[item.id] || (orderType === "dine-in" && !currentTableId)}
                    className="w-full btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sepete Ekle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Order Summary */}
      <div className="w-80 shrink-0 card flex flex-col min-h-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-white">
            <ShoppingCartIcon className="h-5 w-5" />
            <h3 className="font-semibold">Güncel Sipariş</h3>
          </div>
          {currentTable && <p className="text-sm text-white/70 mt-1">Masa: {currentTable.number}</p>}
        </div>

        <div className="flex flex-col p-4 flex-1 overflow-y-auto">
          <div className="space-y-3">
            {currentOrder.length === 0 ? (
              <div className="text-center text-white/60 mt-8">
                <ShoppingCartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Henüz ürün eklenmedi</p>
              </div>
            ) : (
              currentOrder.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-white truncate">{item.name}</h4>
                    <p className="text-xs text-white/70">{item.quantity} x ₺{item.price.toFixed(2)}</p>
                  </div>
                  <span className="font-semibold text-emerald-400">₺{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          {currentOrder.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-white">Toplam:</span>
                <span className="text-xl font-bold text-emerald-400">₺{getTotalOrderValue().toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                {(
                  <button className="w-full btn-success" onClick={handleOrderSubmit}>
                    Siparişi Onayla (Bekletmede)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
