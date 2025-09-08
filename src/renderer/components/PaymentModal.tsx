import React, { useState, useRef, useEffect } from "react";
import { useSelector } from "react-redux";

interface OrderItem {
  id: number;
  name?: string;
  quantity: number;
  price: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSubmit: (
    paymentMethod: import('../../shared/types').PaymentMethod,
  customerId?: number
  ) => void | Promise<void>;
  selectedPaymentMethod: import('../../shared/types').PaymentMethod | null;
  onPaymentMethodSelect: (method: import('../../shared/types').PaymentMethod | null) => void;
  totalAmount: number;
  orderInfo?: {
    tableNumber?: string;
    orderId?: number;
  };
  orderItems?: OrderItem[];
  title?: string;
  onSplitPayment?: (splitData: {
    paymentMethod: import('../../shared/types').PaymentMethod;
    splitType: "items" | "amount";
    splitItems?: { itemId: number; quantity: number }[];
    splitAmount?: number;
  }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSubmit,
  selectedPaymentMethod,
  onPaymentMethodSelect,
  totalAmount,
  orderInfo,
  orderItems = [],
  title = "Ödeme Yöntemi Seçin",
  onSplitPayment,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  // Store just the selected customer id for simplicity
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [splitType, setSplitType] = useState<"items" | "amount">("items");
  const [splitItems, setSplitItems] = useState<{ [itemId: number]: number }>(
    {}
  );
  const [splitAmount, setSplitAmount] = useState<string>("");
  const splitAmountInputRef = useRef<HTMLInputElement>(null);

  // Metin normalize: büyük/küçük, Türkçe karakter, aksan, ekstra boşluk ayıkla
  const normalizeText = (s: string) => s
    ? s
        .toLocaleLowerCase('tr')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu,'') // aksanları sil
        .replace(/ı/g,'i')              // dotless i -> i
        .replace(/[^a-z0-9çğıöşü\s]/g,' ') // alfasayısal dışını boşluk yap (tr karakterlerini bırak)
        .replace(/\s+/g,' ')
        .trim()
    : '';

  // Seçili müşterinin detay paneli açık mı (toggle için aynı ID'ye tekrar tıklayınca kapanacak)
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);

  useEffect(() => {
    if (showCustomerModal) {
      window.electronAPI.getCustomers().then(setCustomers);
    }
  }, [showCustomerModal]);
  // Modal her açıldığında split state'lerini ve ödeme yöntemini sıfırla
  useEffect(() => {
    if (isOpen) {
      setShowSplitOptions(false);
      setSplitItems({});
      setSplitType("items");
      setSplitAmount("");
      onPaymentMethodSelect(null as any);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedPaymentMethod) {
      onPaymentSubmit(selectedPaymentMethod);
    }
  };

  const partialPayments = useSelector(
    (state: any) => state.partialOrder.payments
  );

  const getSplitTotal = () => {
    if (!orderInfo || !orderInfo.orderId) return 0;
    const payment = partialPayments.find(
      (p: any) => p.orderId === orderInfo.orderId
    );
    if (!payment) return 0;
    return (
      (payment.cash || 0) + (payment.credit_kart || 0) + (payment.ticket || 0)
    );
  };

  const getSplitAmount = () => {
    if (splitType === "amount") {
      return parseFloat(splitAmount) || 0;
    } else {
      return Object.entries(splitItems).reduce((total, [itemId, quantity]) => {
        const item = orderItems.find((i) => i.id === parseInt(itemId));
        return total + (item ? item.price * quantity : 0);
      }, 0);
    }
  };

  const handleSplitSubmit = () => {
    if (!selectedPaymentMethod || !onSplitPayment) return;

    if (splitType === "items") {
      // splitItems objesini array'e çevir
      const itemsArray = Object.entries(splitItems)
        .filter(([itemId, quantity]) => quantity > 0)
        .map(([itemId, quantity]) => ({
          itemId: parseInt(itemId),
          quantity,
        }));
      if (itemsArray.length === 0) {
        alert("Bölüştürülecek ürün seçilmedi!");
        return;
      }
      // Seçili ürünlerin toplam fiyatını hesapla
      const totalSelectedPrice = itemsArray.reduce((sum, item) => {
        const found = orderItems.find((i) => i.id === item.itemId);
        return sum + (found ? found.price * item.quantity : 0);
      }, 0);

      onSplitPayment({
        paymentMethod: selectedPaymentMethod,
        splitType: "items",
        splitItems: itemsArray,
        splitAmount: totalSelectedPrice,
      });
      onClose();
    } else {
      const amount = parseFloat(splitAmount);
      // Kalan tutarı partialPayments ve split ödemelerden hesapla
      const alreadyPaid = getSplitTotal();
      const remaining = totalAmount - alreadyPaid;
      console.log("amount " + amount);
      console.log("remaining : " + remaining);
      if (amount > 0 && amount <= remaining) {
        onSplitPayment({
          paymentMethod: selectedPaymentMethod,
          splitType: "amount",
          splitAmount: amount,
        });
        onClose();
      } else {
        alert(
          `Bölüştürülecek miktar kalan tutarı (₺${remaining.toFixed(
            2
          )}) geçemez!`
        );
      }
    }
  };

  const handleItemQuantityChange = (itemId: number, delta: number) => {
    setSplitItems((prev) => {
      const currentItem = orderItems.find((item) => item.id === itemId);
      if (!currentItem) return prev;

      const currentQuantity = prev[itemId] || 0;
      const newQuantity = Math.max(
        0,
        Math.min(currentItem.quantity, currentQuantity + delta)
      );

      return {
        ...prev,
        [itemId]: newQuantity,
      };
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          width: "384px",
          maxWidth: "90vw",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          {showSplitOptions ? "Hesap Bölüştürme" : title}
        </h2>

        {!showSplitOptions && onSplitPayment && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <button
              onClick={() => setShowSplitOptions(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🍴 Hesap Bölüştür
            </button>
          </div>
        )}

        {showSplitOptions && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                onClick={() => setSplitType("items")}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor:
                    splitType === "items" ? "#3b82f6" : "#f3f4f6",
                  color: splitType === "items" ? "white" : "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Ürün Bazlı
              </button>
              <button
                onClick={() => setSplitType("amount")}
                style={{
                  flex: 1,
                  padding: "8px",
                  backgroundColor:
                    splitType === "amount" ? "#3b82f6" : "#f3f4f6",
                  color: splitType === "amount" ? "white" : "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Miktar Bazlı
              </button>
            </div>

            {splitType === "items" && (
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  marginBottom: "16px",
                }}
              >
                {orderItems.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#6b7280",
                      backgroundColor: "#f9fafb",
                      borderRadius: "6px",
                    }}
                  >
                    Bölüştürülecek ürün bulunamadı
                    <br />
                    <small>orderItems: {JSON.stringify(orderItems)}</small>
                  </div>
                ) : (
                  orderItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px",
                        marginBottom: "8px",
                        backgroundColor: "#f9fafb",
                        borderRadius: "6px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>
                          {item.name || "Ürün"}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          ₺{item.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <button
                          onClick={() => handleItemQuantityChange(item.id, -1)}
                          disabled={!splitItems[item.id]}
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            minWidth: "20px",
                            textAlign: "center",
                            fontSize: "14px",
                          }}
                        >
                          {splitItems[item.id] || 0}
                        </span>
                        <button
                          onClick={() => handleItemQuantityChange(item.id, 1)}
                          disabled={splitItems[item.id] >= item.quantity}
                          style={{
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "14px",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {splitType === "amount" && (
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Bölüştürülecek Miktar (₺):
                </label>
                <input
                  ref={splitAmountInputRef}
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={splitAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.,]/g, "");
                    setSplitAmount(val);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: "#ffffff",
                    color: "#111827",
                    caretColor: "#111827",
                  }}
                  placeholder={`Max: ₺${totalAmount.toFixed(2)}`}
                />
              </div>
            )}

            <div
              style={{
                padding: "12px",
                backgroundColor: "#f0f9ff",
                borderRadius: "6px",
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1d4ed8",
                }}
              >
                Bölüştürülen: ₺{(getSplitAmount() + getSplitTotal()).toFixed(2)}
              </div>
              <div
                style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}
              >
                Kalan: ₺
                {(totalAmount - getSplitTotal() - getSplitAmount()).toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {orderInfo && (
          <div
            style={{
              marginBottom: "16px",
              textAlign: "center",
              padding: "12px",
              backgroundColor: "#f3f4f6",
              borderRadius: "8px",
            }}
          >
            {orderInfo.tableNumber && (
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                Masa {orderInfo.tableNumber}
              </div>
            )}
            {orderInfo.orderId && (
              <div style={{ fontSize: "14px", color: "#6b7280" }}>
                Sipariş #{orderInfo.orderId}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: "24px" }}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "18px", fontWeight: "600" }}>
              {showSplitOptions ? "Ödenecek Tutar" : "Toplam"}:{" "}
            </span>
            <span
              style={{ fontSize: "24px", fontWeight: "bold", color: "#2563eb" }}
            >
              ₺
              {showSplitOptions
                ? getSplitAmount().toFixed(2)
                : totalAmount.toFixed(2)}
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <button
              onClick={() => onPaymentMethodSelect("nakit")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                border:
                  selectedPaymentMethod === "nakit"
                    ? "2px solid #10b981"
                    : "2px solid #d1d5db",
                backgroundColor:
                  selectedPaymentMethod === "nakit" ? "#ecfdf5" : "white",
                color:
                  selectedPaymentMethod === "nakit" ? "#059669" : "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "24px" }}>💵</span>
              <span style={{ fontWeight: "600" }}>Nakit</span>
            </button>

            <button
              onClick={() => onPaymentMethodSelect("kredi-karti")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                border:
                  selectedPaymentMethod === "kredi-karti"
                    ? "2px solid #3b82f6"
                    : "2px solid #d1d5db",
                backgroundColor:
                  selectedPaymentMethod === "kredi-karti" ? "#eff6ff" : "white",
                color:
                  selectedPaymentMethod === "kredi-karti"
                    ? "#1d4ed8"
                    : "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "24px" }}>💳</span>
              <span style={{ fontWeight: "600" }}>Kredi Kartı</span>
            </button>

            <button
              onClick={() => onPaymentMethodSelect("ticket")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "8px",
                border:
                  selectedPaymentMethod === "ticket"
                    ? "2px solid #8b5cf6"
                    : "2px solid #d1d5db",
                backgroundColor:
                  selectedPaymentMethod === "ticket" ? "#f3e8ff" : "white",
                color:
                  selectedPaymentMethod === "ticket" ? "#7c3aed" : "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "24px" }}>🎫</span>
              <span style={{ fontWeight: "600" }}>Ticket</span>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            İptal
          </button>
          <button
            onClick={() => setShowCustomerModal(true)}
            style={{
              flex: 1,
              padding: "8px 16px",
              backgroundColor: "#f59e42",
              color: "white",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
              zIndex: 1,
              position: "relative",
            }}
          >
            Borca Yaz
          </button>
          <button
            onClick={(e) => {
              (showSplitOptions ? handleSplitSubmit : handleSubmit)();
            }}
            disabled={
              Boolean(!selectedPaymentMethod) ||
              (showSplitOptions && getSplitAmount() <= 0)
            }
            style={{
              flex: 1,
              padding: "8px 16px",
              backgroundColor: selectedPaymentMethod ? "#16a34a" : "#9ca3af",
              color: "white",
              borderRadius: "8px",
              border: "none",
              fontWeight: "600",
              cursor:
                selectedPaymentMethod &&
                (!showSplitOptions || getSplitAmount() > 0)
                  ? "pointer"
                  : "not-allowed",
              zIndex: 1,
              position: "relative",
            }}
          >
            {showSplitOptions ? "Bölüştürerek Öde" : "Ödemeyi Onayla"}
          </button>
        </div>

        {/* Müşteri seçme modalı */}
        {showCustomerModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
            }}
          >
            <div
              style={{
                background: "linear-gradient(145deg,#1f2937,#111827)",
                borderRadius: "8px",
                padding: "24px 24px 20px",
                minWidth: "320px",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  marginBottom: "16px",
                  textAlign: "center",
                  color: '#f9fafb'
                }}
              >
                Müşteri Seç
              </h3>
              {/* Search & Info bar */}
              <div style={{
                display:'flex',
                gap:8,
                marginBottom:8,
                alignItems:'center'
              }}>
                <input
                  autoFocus
                  placeholder="Ara..."
                  value={customerSearch}
                  onChange={(e)=> setCustomerSearch(e.target.value)}
                  style={{
                    flex:1,
                    background:'#0f172a',
                    border:'1px solid rgba(255,255,255,0.08)',
                    color:'#e2e8f0',
                    padding:'6px 10px',
                    borderRadius:6,
                    fontSize:13,
                    outline:'none'
                  }}
                />
                {/* Kapat ipucunu kaldırdık - kullanıcı ESC ile yine kapatabilir */}
              </div>
              {/* Info bar */}
              <div style={{
                background: '#0f172a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 12,
                color: '#94a3b8',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Toplam: {customers.length}</span>
                {selectedCustomer && (
                  <span style={{color:'#38bdf8'}}>Seçili ID: {selectedCustomer}</span>
                )}
              </div>
              {/* Örnek müşteri listesi, gerçek projede API'den veya store'dan alınmalı */}
              <div
                style={{
                  maxHeight: "260px",
                  overflowY: "auto",
                  marginBottom: "16px",
                  paddingRight: 4
                }}
              >
                {customers.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#64748b", fontSize: 14 }}>Müşteri bulunamadı</div>
                ) : (
                  customers
                    .filter(c => {
                      if(!customerSearch) return true;
                      const target = normalizeText(c.customerName ?? '');
                      const query = normalizeText(customerSearch);
                      return target.includes(query);
                    })
                    .map((customer) => {
                    const active = selectedCustomer === customer.id;
                    return (
                      <div key={customer.id} style={{marginBottom:6}}>
                        <div
                          onClick={() => {
                            setSelectedCustomer(customer.id);
                            setExpandedCustomerId(prev => prev === customer.id ? null : customer.id);
                          }}
                          style={{
                            padding: '10px 12px',
                            background: active ? 'linear-gradient(120deg,#2563eb,#1d4ed8)' : '#182230',
                            border: active ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'background .18s,border-color .18s',
                            color: active ? '#ffffff' : '#e2e8f0',
                            fontWeight: active ? 600 : 500,
                            fontSize: 14,
                            letterSpacing: 0.2,
                          }}
                          onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = '#243044'); }}
                          onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = '#182230'); }}
                        >
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap', flex:1, paddingRight:8}}>{customer.customerName}</span>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {customer.address && (
                              <span style={{fontSize:10,opacity:.6, background:'rgba(255,255,255,0.12)',padding:'2px 5px',borderRadius:4}}>Adres</span>
                            )}
                            {(customer.telephoneNumber) && (
                              <span style={{fontSize:10,opacity:.6, background:'rgba(255,255,255,0.12)',padding:'2px 5px',borderRadius:4}}>Tel</span>
                            )}
                            {active && <span style={{fontSize:11, background:'rgba(255,255,255,0.25)', padding:'2px 6px', borderRadius:999}}>Seçili</span>}
                          </div>
                        </div>
                        {expandedCustomerId === customer.id && (customer.address || customer.telephoneNumber) && (
                          <div style={{
                            marginTop:4,
                            background:'rgba(255,255,255,0.04)',
                            border:'1px solid rgba(255,255,255,0.08)',
                            borderRadius:6,
                            padding:'8px 10px',
                            fontSize:12,
                            color:'#cbd5e1',
                            lineHeight:1.4,
                            backdropFilter:'blur(2px)'
                          }}>
                            {customer.address && (
                              <div style={{marginBottom: customer.telephoneNumber ? 4 : 0}}>
                                <span style={{opacity:.55}}>Adres: </span>{customer.address}
                              </div>
                            )}
                            {customer.telephoneNumber && (
                              <div>
                                <span style={{opacity:.55}}>Tel: </span>{customer.telephoneNumber}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => setShowCustomerModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={() => {
                    if (selectedCustomer && onPaymentSubmit) {
                      onPaymentSubmit("borc", selectedCustomer);
                      setShowCustomerModal(false);
                      onClose();
                    }
                  }}
                  disabled={!selectedCustomer}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    background: selectedCustomer ? 'linear-gradient(90deg,#f59e0b,#f97316)' : '#475569',
                    color: selectedCustomer ? '#ffffff' : '#cbd5e1',
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "600",
                    cursor: selectedCustomer ? "pointer" : "not-allowed",
                    boxShadow: selectedCustomer ? '0 0 0 1px rgba(255,255,255,0.08),0 4px 12px -2px rgba(0,0,0,0.4)' : 'none',
                    transition: 'filter .15s, transform .15s',
                  }}
                  onMouseEnter={(e) => { if (selectedCustomer) e.currentTarget.style.filter='brightness(1.05)'; }}
                  onMouseLeave={(e) => { if (selectedCustomer) e.currentTarget.style.filter='brightness(1)'; }}
                  onMouseDown={(e) => { if (selectedCustomer) e.currentTarget.style.transform='translateY(1px)'; }}
                  onMouseUp={(e) => { if (selectedCustomer) e.currentTarget.style.transform='translateY(0)'; }}
                >
                  Borca Yaz
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
