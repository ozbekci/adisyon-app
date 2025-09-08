import React, { useEffect, useState } from "react";
import type { PaymentMethod } from "../../shared/types";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import {
  fetchOrders,
  updateOrderStatusAsync,
} from "../store/slices/ordersSlice";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import PaymentModal from "../components/PaymentModal";
import {
  addPartialPayment,
  clearPartialPayment,
  addPaidOrderItems,
} from "../store/slices/partialOrderSlice";

const OrdersPage: React.FC = () => {
  const [shouldSavePartial, setShouldSavePartial] = useState<null | {
    orderId: number;
    orderTotal: number;
  }>(null);

  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading } = useSelector((state: RootState) => state.orders);
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    PaymentMethod | null
  >(null);
  const partialPayments = useSelector(
    (state: RootState) => state.partialOrder.payments
  );

  useEffect(() => {
    try {
      console.log(partialPayments[0]);
    } catch (error) {}
    if (shouldSavePartial) {
      // En güncel partialPayments ile toplamı hesapla
      const totalPaidObj = getPartialTotal(shouldSavePartial.orderId);
      const paidSum =
        totalPaidObj.cash + totalPaidObj.credit_kart + totalPaidObj.ticket;
      if (paidSum >= shouldSavePartial.orderTotal) {
        (async () => {
          try {
            const orderhistory = await (
              window as any
            ).electronAPI.processPayment({
              orderId: shouldSavePartial.orderId,
              amount: shouldSavePartial.orderTotal,
              method: "partial-payment",
            });
            const response = await (
              window as any
            ).electronAPI.recordPartialPayment({
              orderHistoryId: orderhistory,
              cash: totalPaidObj.cash,
              credit_kart: totalPaidObj.credit_kart,
              ticket: totalPaidObj.ticket,
            });
            if (response) {
              alert("Tüm tutar ödendi ve kaydedildi!");
              dispatch(clearPartialPayment(shouldSavePartial.orderId));
              dispatch(fetchOrders());
              setShowPaymentModal(false);
              setSelectedPaymentMethod(null);
              setSelectedOrder(null);
            } else {
              alert("Kısmi ödeme kaydı başarısız oldu!");
            }
          } catch (error) {
            alert("Kısmi ödeme kaydı sırasında hata oluştu!");
            console.error("Partial payment error:", error);
          }
        })();
      }
      setShouldSavePartial(null);
    }
  }, [partialPayments, shouldSavePartial]);

  useEffect(() => {
    console.log("databaseden çekildi");
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleStatusUpdate = (orderId: number, status: any) => {
    dispatch(updateOrderStatusAsync({ id: orderId, status }));
  };

  const handleDeleteOrder = async (orderId: number, tableNumber: string) => {
    const confirmed = window.confirm(
      `Masa ${tableNumber} siparişini silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve sipariş tamamen silinecek.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await (window as any).electronAPI.deleteOrder(orderId);

      if (response) {
        alert("Sipariş başarıyla silindi!");
        // Siparişleri yenile
        dispatch(fetchOrders());
      } else {
        alert("Sipariş silinemedi!");
      }
    } catch (error) {
      alert("Sipariş silinirken hata oluştu!");
      console.error("Error deleting order:", error);
    }
  };

  const handlePaymentClick = (order: any) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (
    paymentMethod: PaymentMethod,
    customerId?: number
  ) => {
    if (!selectedOrder) {
      alert("Sipariş seçilmedi.");
      return;
    }

    try {
      // Ödeme işlemini gerçekleştir
      let paymentPayload: any = {
        orderId: selectedOrder.id,
        amount: selectedOrder.total,
        method: paymentMethod,
      };
      if (paymentMethod === "borc" && customerId) {
        paymentPayload.customer_id = customerId;
      }
      const response = await (window as any).electronAPI.processPayment(
        paymentPayload
      );
      console.log(response);
      if (response) {
        alert(`Sipariş ${paymentMethod} ile ödendi!`);
        // If dine-in order, set table status back to available
        if (selectedOrder.table_id) {
          await (window as any).electronAPI.updateTable(
            selectedOrder.table_id,
            { status: "available" }
          );
        }
        // Siparişleri yenile
        dispatch(fetchOrders());
        setShowPaymentModal(false);
        setSelectedPaymentMethod(null);
        setSelectedOrder(null);
      } else {
        alert("Ödeme işlemi başarısız oldu!");
      }
    } catch (error) {
      alert("Ödeme işlemi başarısız oldu!");
      console.error(error);
    }
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedPaymentMethod(null);
    setSelectedOrder(null);
  };

  // getPartialTotal fonksiyonu PartialPayment tipinde bir değer döndürür
  const getPartialTotal = (
    orderId: number
  ): {
    cash: number;
    credit_kart: number;
    ticket: number;
  } => {
    const payment = partialPayments.find((p) => p.orderId === orderId);
    if (!payment) return { cash: 0, credit_kart: 0, ticket: 0 };
    return {
      cash: payment.cash || 0,
      credit_kart: payment.credit_kart || 0,
      ticket: payment.ticket || 0,
    };
  };

  const handleSplitPayment = async (splitData: {
    paymentMethod: PaymentMethod;
    splitType: "items" | "amount";
    splitItems?: { itemId: number; quantity: number }[];
    splitAmount?: number;
  }) => {
    if (!selectedOrder) {
      alert("Sipariş seçilmedi.");
      return;
    }
    let cash = 0,
      credit_kart = 0,
      ticket = 0;
    if (splitData.paymentMethod === "nakit") cash = splitData.splitAmount || 0;
    if (splitData.paymentMethod === "kredi-karti")
      credit_kart = splitData.splitAmount || 0;
    if (splitData.paymentMethod === "ticket")
      ticket = splitData.splitAmount || 0;
    if (splitData.splitType == "amount") {
      // Split payment amount calculation

      // Add partial payment to slice
      dispatch(
        addPartialPayment({
          orderId: selectedOrder.id,
          cash,
          credit_kart,
          ticket,
        })
      );

      // En güncel toplamı bir sonraki renderda backend'e kaydetmek için flag'i set et
      setShouldSavePartial({
        orderId: selectedOrder.id,
        orderTotal: selectedOrder.total,
      });
      // Kalan tutarı göster
      const totalPaidObj = getPartialTotal(selectedOrder.id);
      let paidSum =
        totalPaidObj.cash +
        totalPaidObj.credit_kart +
        totalPaidObj.ticket +
        (splitData.splitAmount || 0);
      const orderTotal = selectedOrder.total;
      if (paidSum < orderTotal) {
        alert(
          `Kısmi ödeme alındı! Kalan: ₺${(orderTotal - paidSum).toFixed(2)}`
        );
      }
      // Split ödeme sonrası partialPayments güncellendiğinde backend'e kaydet
    } else {
      // splitType: "items" ise ürün bazlı bölüştürme
      if (!selectedOrder) {
        alert("Sipariş seçilmedi.");
        return;
      }
      if (!splitData.splitItems || splitData.splitItems.length === 0) {
        alert("Bölüştürülecek ürün seçilmedi.");
        return;
      }

      // split edilen itemlerin quantity'sini Redux'ta güncelle
      splitData.splitItems?.forEach((paid) => {
        const orderItem = selectedOrder.items.find(
          (i: any) => i.id === paid.itemId
        );
        if (orderItem) {
          const newQuantity = Math.max(0, orderItem.quantity - paid.quantity);
          dispatch({
            type: "orders/updateOrderItemQuantity",
            payload: { id: paid.itemId, quantity: newQuantity },
          });
        }
      });
      dispatch(
        addPaidOrderItems({
          orderId: selectedOrder.id,
          paid_order_items: splitData.splitItems,
          cash: cash,
          ticket: ticket,
          credit_kart: credit_kart,
        })
      );
      setShouldSavePartial({
        orderId: selectedOrder.id,
        orderTotal: selectedOrder.total,
      });
      alert("Ürün bazlı kısmi ödeme kaydedildi!");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/15 text-amber-300";
      case "preparing":
        return "bg-blue-500/15 text-blue-300";
      case "ready":
        return "bg-emerald-500/15 text-emerald-300";
      case "served":
        return "bg-slate-500/15 text-slate-300";
      default:
        return "bg-white/10 text-white/80";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Bekliyor";
      case "preparing":
        return "Hazırlanıyor";
      case "ready":
        return "Hazır";
      case "served":
        return "Servis Edildi";
      default:
        return "Bilinmiyor";
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
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
      {/* Ödeme Modalı */}
      <PaymentModal
        key={selectedOrder ? `${selectedOrder.id}-${showPaymentModal}` : "none"}
        isOpen={showPaymentModal}
        onClose={handlePaymentModalClose}
        onPaymentSubmit={handlePaymentSubmit}
        selectedPaymentMethod={selectedPaymentMethod}
        onPaymentMethodSelect={setSelectedPaymentMethod}
        totalAmount={selectedOrder?.total || 0}
        orderItems={selectedOrder?.items || []}
        orderInfo={
          selectedOrder
            ? {
                tableNumber: selectedOrder.table_number,
                orderId: selectedOrder.id,
              }
            : undefined
        }
        onSplitPayment={handleSplitPayment}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Aktif Siparişler</h2>
          <p className="text-white/70">
            Sipariş durumlarını takip edin ve güncelleyin
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex space-x-4">
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-amber-500/15 text-amber-300">
            {orders.filter((o) => o.status === "pending").length} Bekleyen
          </div>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/15 text-blue-300">
            {orders.filter((o) => o.status === "preparing").length} Hazırlanıyor
          </div>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/15 text-emerald-300">
            {orders.filter((o) => o.status === "ready").length} Hazır
          </div>
          {/* New Order Button */}
          <button
            onClick={() => navigate("/orders/new")}
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" /> Sipariş Al
          </button>
        </div>
      </div>

      {/* Orders Grid - only this section scrolls */}
      <div className="flex-1 min-h-0 card overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          {orders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white/70">
                <ClockIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Henüz sipariş yok</h3>
                <p>Yeni siparişler burada görünecek</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders
                .filter((o) => ["pending", "preparing", "ready", "served"].includes(o.status))
                .map((order) => (
                  <div key={order.id} className="card p-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">Masa {order.table_number}</h3>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-white/90">{item.quantity}x {item.name}</span>
                          <span className="text-white/70">₺{(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-white/90">Toplam:</span>
                        <span className="text-lg font-bold text-emerald-400">₺{order.total.toFixed(2)}</span>
                      </div>
                      {/* Kalan Tutar */}
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-white/90">Kalan:</span>
                        <span className="text-lg font-bold text-rose-400">₺{(() => {
                          const payment = partialPayments.find((p) => p.orderId === order.id);
                          const paidSum = payment ? (payment.cash || 0) + (payment.credit_kart || 0) + (payment.ticket || 0) : 0;
                          return (order.total - paidSum).toFixed(2);
                        })()}</span>
                      </div>

                      <div className="flex justify-between items-center mb-3 text-sm text-white/70">
                        <span>Sipariş Zamanı:</span>
                        <span>{formatTime(order.created_at)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          {order.status === "pending" && (
                            <button onClick={() => handleStatusUpdate(order.id, "preparing")} className="flex-1 btn-primary">
                              Hazırlanıyor
                            </button>
                          )}
                          {order.status === "preparing" && (
                            <button onClick={() => handleStatusUpdate(order.id, "ready")} className="flex-1 btn-success">
                              Hazır
                            </button>
                          )}
                          {order.status === "ready" && (
                            <button onClick={() => handleStatusUpdate(order.id, "served")} className="flex-1 btn-secondary">
                              Servis Edildi
                            </button>
                          )}
                          {order.status !== "served" && (
                            <button onClick={() => handleDeleteOrder(order.id, order.table_number || "Bilinmeyen")} className="px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-400/10" title="Siparişi Sil">
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        {/* Ödeme Al Butonu */}
                        {order.status === "served" && order.payment_status !== "paid" && (
                          <button onClick={() => handlePaymentClick(order)} className="w-full btn-primary">
                            💳 Ödeme Al
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
