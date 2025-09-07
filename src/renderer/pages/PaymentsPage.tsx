import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { processPayment } from '../store/slices/paymentsSlice';
import { updateOrderStatus } from '../store/slices/ordersSlice';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  DevicePhoneMobileIcon,
  PrinterIcon,
  CalculatorIcon 
} from '@heroicons/react/24/outline';

const PaymentsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders } = useSelector((state: RootState) => state.orders);
  const { dailyTotal } = useSelector((state: RootState) => state.payments);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile' | 'debt'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [receivedAmount, setReceivedAmount] = useState<string>('');

  const unpaidOrders = orders.filter(order => order.status === 'served');

  const handlePayment = async () => {
    if (!selectedOrder) return;

    try {
      await dispatch(processPayment({
        orderId: selectedOrder.id,
        amount: selectedOrder.total,
        method: paymentMethod
      }));

      dispatch(updateOrderStatus({ id: selectedOrder.id, status: 'paid' }));
      
      setSelectedOrder(null);
      setReceivedAmount('');
      setCustomerName('');
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  const calculateChange = () => {
    if (!selectedOrder || !receivedAmount) return 0;
    return parseFloat(receivedAmount) - selectedOrder.total;
  };

  const paymentMethods = [
    { id: 'cash', name: 'Nakit', icon: BanknotesIcon, theme: { border: 'border-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-300' } },
    { id: 'card', name: 'Kart', icon: CreditCardIcon, theme: { border: 'border-blue-400', bg: 'bg-blue-400/10', text: 'text-blue-300' } },
    { id: 'mobile', name: 'Mobil Ödeme', icon: DevicePhoneMobileIcon, theme: { border: 'border-purple-400', bg: 'bg-purple-400/10', text: 'text-purple-300' } },
    { id: 'debt', name: 'Borç', icon: CreditCardIcon, theme: { border: 'border-rose-400', bg: 'bg-rose-400/10', text: 'text-rose-300' } },
  ] as const;

  return (
    <div className="h-full flex">
      {/* Orders List */}
      <div className="w-1/2 p-6 border-r border-white/10">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">Ödeme Bekleyen Siparişler</h2>
          <p className="text-white/70">Ödeme alınacak siparişleri seçin</p>
        </div>

        <div className="space-y-3 overflow-auto h-full pr-2">
          {unpaidOrders.length === 0 ? (
            <div className="text-center text-white/60 mt-16">
              <CalculatorIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ödeme bekleyen sipariş yok</h3>
              <p>Servis edilmiş siparişler burada görünecek</p>
            </div>
          ) : (
            unpaidOrders.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 card ${
                  selectedOrder?.id === order.id ? 'ring-1 ring-blue-400 bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">
                      Masa {order.table_number}
                    </h3>
                  </div>
                  <span className="text-lg font-bold text-emerald-300">
                    ₺{order.total.toFixed(2)}
                  </span>
                </div>
                
                <div className="text-sm text-white/70">
                  {order.items.length} ürün • {new Date((order as any).created_at || (order as any).createdAt).toLocaleTimeString('tr-TR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Payment Panel */}
      <div className="w-1/2 p-6">
        {!selectedOrder ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white/60">
              <CreditCardIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Sipariş Seçin</h3>
              <p>Ödeme almak için bir sipariş seçin</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Selected Order Details */}
            <div className="card p-4 mb-6">
              <h3 className="font-semibold text-white mb-3">
                Masa {selectedOrder.table_number}
              </h3>
              
              <div className="space-y-2 mb-4 text-white/80">
                {selectedOrder.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span>₺{(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-white/80">Toplam:</span>
                  <span className="text-lg text-emerald-300">₺{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <h4 className="font-medium text-white mb-3">Ödeme Yöntemi</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethods.map(method => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-4 rounded-lg text-center transition-all duration-200 card border ${active ? method.theme.border + ' ' + method.theme.bg : 'border-white/10 hover:bg-white/5'}`}
                    >
                      <Icon className={`h-6 w-6 mx-auto mb-2 ${active ? method.theme.text : 'text-white/60'}`} />
                      <span className="text-sm font-medium text-white">{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Payment Input */}
            {paymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Alınan Tutar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="input w-full"
                  placeholder="0.00"
                />
                {receivedAmount && (
                  <div className="mt-2 text-sm text-white/80">
                    <div className="flex justify-between">
                      <span>Alınan:</span>
                      <span>₺{parseFloat(receivedAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Toplam:</span>
                      <span>₺{selectedOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-white/10 pt-1 mt-1">
                      <span>Para Üstü:</span>
                      <span className={calculateChange() >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                        ₺{calculateChange().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Debt Name Input */}
            {paymentMethod === 'debt' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-white/80 mb-2">Müşteri Adı</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input w-full"
                  placeholder="İsim"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto space-y-3">
              <button
                onClick={handlePayment}
                disabled={paymentMethod === 'cash' && calculateChange() < 0}
                className="w-full btn-success text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ödeme Al
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-secondary flex items-center justify-center space-x-2">
                  <PrinterIcon className="h-5 w-5" />
                  <span>Adisyon Yazdır</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setReceivedAmount('');
                  }}
                  className="btn-secondary"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
