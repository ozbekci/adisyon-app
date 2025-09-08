import { DatabaseManager, Order } from '../DatabaseManager';

export function registerOrderDomain(proto: typeof DatabaseManager.prototype) {
  (proto as any).allowedStatusFlow = { pending: ['preparing'], preparing: ['ready'], ready: ['served'], served: ['paid'] };

  proto.getOpenOrderForTable = async function (this: DatabaseManager, tableId: number) {
    const order = await (this as any).get("SELECT * FROM orders WHERE table_id = $1 AND status NOT IN ('served','paid') ORDER BY id DESC LIMIT 1", [tableId]);
    if (!order) return null;
    return await (this as any).getOrderWithItems(order.id);
  };

  (proto as any).recalcOrderTotal = async function (this: DatabaseManager, orderId: number) {
    const row = await (this as any).get('SELECT COALESCE(SUM(quantity * price),0) as total FROM order_items WHERE order_id = $1', [orderId]);
    await (this as any).run('UPDATE orders SET total = $1, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = $2', [row.total || 0, orderId]);
  };

  (proto as any).getOrderWithItems = async function (this: DatabaseManager, orderId: number) {
    const order = await (this as any).get('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) return null;
    const items = await (this as any).all('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    order.items = items;
    return order;
  };

  proto.addItemsToOrder = async function (this: DatabaseManager, orderId: number, items: Array<{ menuItemId: number; quantity: number; notes?: string }>) {
    const order = await (this as any).get('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (['ready','served','paid'].includes(order.status)) throw new Error('ORDER_LOCKED');
    for (const it of items) {
      if (it.quantity <= 0) continue;
      const priceRow = await (this as any).get('SELECT price FROM menu_items WHERE id = $1 AND available = true AND is_active = true', [it.menuItemId]);
      if (!priceRow) throw new Error('MENU_ITEM_UNAVAILABLE');
      const now = (this as any).getTurkeyDateTime();
      await (this as any).run('INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6)', [orderId, it.menuItemId, it.quantity, priceRow.price, it.notes || null, now]);
    }
    await (this as any).recalcOrderTotal(orderId);
    return await (this as any).getOrderWithItems(orderId);
  };

  proto.listActiveOrders = async function (this: DatabaseManager) {
    const rows = await (this as any).all("SELECT * FROM orders WHERE status NOT IN ('served','paid') ORDER BY created_at ASC");
    for (const r of rows) { r.items = await (this as any).all('SELECT * FROM order_items WHERE order_id = $1', [r.id]); }
    return rows;
  };

  proto.getOrderPublic = async function (this: DatabaseManager, orderId: number) { return await (this as any).getOrderWithItems(orderId); };

  proto.updateOrderStatusValidated = async function (this: DatabaseManager, orderId: number, newStatus: string, expectedVersion?: number) {
    const order = await (this as any).get('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (order.status === newStatus) return await (this as any).getOrderWithItems(orderId);
    const allowed = (this as any).allowedStatusFlow[order.status as string] || [];
    if (!allowed.includes(newStatus)) throw new Error('INVALID_STATUS');
    if (expectedVersion !== undefined && order.version !== expectedVersion) throw new Error('VERSION_CONFLICT');
    await (this as any).run('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP, version = version + 1 WHERE id = $2', [newStatus, orderId]);
    return await (this as any).getOrderWithItems(orderId);
  };

  proto.setWaiterPin = proto.setWaiterPin; // preserve if needed elsewhere

  proto.createOrder = async function (this: DatabaseManager, orderData: { items: any[]; tableId?: number; orderType?: 'dine-in' | 'takeaway' | 'delivery' | 'trendyol'; customerId?: number | null; customerName?: string | null; paymentMethod?: string; isPaid?: boolean; }): Promise<Order> {
    const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderType = orderData.orderType || (orderData.tableId ? 'dine-in' : 'takeaway');
    const paymentStatus = orderData.isPaid ? 'paid' : 'unpaid';
    let tableNumber: string | null = null;
    if (orderData.tableId) {
      const tbl = await (this as any).get('SELECT number FROM tables WHERE id = $1', [orderData.tableId]);
      tableNumber = tbl?.number || null;
    }
    const turkeyDateTime = (this as any).getTurkeyDateTime();
  const orderResult = await (this as any).run('INSERT INTO orders (table_id, order_type, customer_id, customer_name, payment_status, table_number, total, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',[orderData.tableId || null, orderType, orderData.customerId || null, orderData.customerName || null, paymentStatus, tableNumber, total, turkeyDateTime]);
    console.log('Order insert result:', orderResult);
    let orderId = orderResult.id;
    if (!orderId) {
      console.log('Order ID not available, finding order by details');
      const newOrder = await (this as any).get('SELECT id FROM orders ORDER BY id DESC LIMIT 1');
      orderId = newOrder?.id;
      console.log('Found order ID:', orderId);
    }
    if (!orderId) throw new Error('Sipariş oluşturulamadı - Order ID bulunamadı');
    console.log('Inserting order items for order ID:', orderId);
    for (const item of orderData.items) {
      console.log('Inserting item:', item);
      const turkeyDate = (this as any).getTurkeyDateTime();
      await (this as any).run('INSERT INTO order_items (order_id, menu_item_id, quantity, price, notes, created_at) VALUES ($1,$2,$3,$4,$5,$6)',[orderId, item.menuItemId, item.quantity, item.price, item.notes || null, turkeyDate]);
    }
    if (orderData.isPaid && orderData.paymentMethod) {
      const paidTime = (this as any).getTurkeyDateTime();
      await (this as any).run('UPDATE orders SET payment_status = $1, paid_at = $2, payment_method = $3, paid_amount = $4 WHERE id = $5',['paid', paidTime, orderData.paymentMethod, total, orderId]);
    }
    if (orderData.tableId) await (this as any).run('UPDATE tables SET status = $1 WHERE id = $2', ['occupied', orderData.tableId]);
    if (orderType === 'takeaway') await (this as any).run('UPDATE orders SET status = $1 WHERE id = $2', ['served', orderId]);
    return await (this as any).getOrderById(orderId);
  };

  proto.getOrders = async function (this: DatabaseManager): Promise<Order[]> {
    const orders = await (this as any).all(`SELECT o.*, t.number as table_number FROM orders o LEFT JOIN tables t ON o.table_id = t.id WHERE o.payment_status != $1 ORDER BY o.created_at DESC`, ['paid']);
    for (const order of orders) {
      order.items = await (this as any).all(`SELECT oi.*, mi.name, mi.description FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = $1`, [order.id]);
    }
    return orders;
  };

  proto.processPayment = async function (this: DatabaseManager, paymentData: { orderId: number; amount: number; method: string; customer_id?: number }) {
    const turkeyDateTime = (this as any).getTurkeyDateTime();
  await (this as any).run('UPDATE orders SET payment_status = $1, paid_at = $2, payment_method = $3, paid_amount = $4 , customer_id = $5 WHERE id = $6',[paymentData.method === 'debt' ? 'debt' : 'paid', turkeyDateTime, paymentData.method, paymentData.amount, paymentData.customer_id || null, paymentData.orderId]);
    const order = await (this as any).get('SELECT table_id FROM orders WHERE id = $1', [paymentData.orderId]);
    if (order?.table_id) await (this as any).run('UPDATE tables SET status = $1 WHERE id = $2', ['available', order.table_id]);
    const historyId = await (this as any).moveOrderToHistory(paymentData.orderId);
    return historyId;
  };

  (proto as any).moveOrderToHistory = async function (this: DatabaseManager, orderId: number) {
    try {
      const order = await (this as any).get('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (!order) { console.log(`Order ${orderId} not found, cannot move to history`); return; }
      const orderItems = await (this as any).all('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
      const paymentType = order.payment_method || 'nakit';
      const paidAt = order.paid_at;
      const paidAmount = order.paid_amount;
  const customer_id = order.customer_id || null;
      console.log(customer_id);
  const historyResult = await (this as any).run('INSERT INTO order_history (order_type, customer_id, total, payment_status, paid_at, payment_method, paid_amount, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',[order.order_type, customer_id, order.total, order.payment_status, paidAt, paymentType, paidAmount, order.created_at]);
      const historyId = historyResult.id;
      for (const item of orderItems) {
        await (this as any).run('INSERT INTO order_history_items (order_history_id, menu_item_id, quantity, price, notes) VALUES ($1, $2, $3, $4, $5)',[historyId, item.menu_item_id, item.quantity, item.price, item.notes]);
      }
      await (this as any).run('DELETE FROM order_items WHERE order_id = $1', [orderId]);
      await (this as any).run('DELETE FROM orders WHERE id = $1', [orderId]);
      console.log(`Order ${orderId} moved to history with ID ${historyId}`);
      return historyId;
    } catch (e) { console.error(`Error moving order ${orderId} to history:`, e); }
  };

  proto.updateOrderStatus = async function (this: DatabaseManager, orderId: number, status: string): Promise<Order> {
    await (this as any).run('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    return await (this as any).getOrderById(orderId);
  };

  proto.deleteOrder = async function (this: DatabaseManager, orderId: number): Promise<boolean> {
    const order = await (this as any).get('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!order) throw new Error('Silinecek sipariş bulunamadı');
    await (this as any).run('DELETE FROM order_items WHERE order_id = $1', [orderId]);
    const result = await (this as any).run('DELETE FROM orders WHERE id = $1', [orderId]);
    if (order.table_id && order.payment_status !== 'paid') await (this as any).run('UPDATE tables SET status = $1 WHERE id = $2', ['available', order.table_id]);
    return result.changes > 0;
  };

  proto.getPastOrders = async function (this: DatabaseManager) {
  console.log('getPastOrders called');
    const orders = await (this as any).all(`
      SELECT 
        oh.*, 
        COALESCE(oh.paid_at, oh.created_at) AS created_at,
        CASE 
          WHEN oh.order_type = 'dine-in' AND oh.customer_id IS NOT NULL 
            THEN (SELECT number::text FROM tables WHERE id = oh.customer_id)
          ELSE oh.customer_id::text 
        END as table_number 
      FROM order_history oh 
      ORDER BY COALESCE(oh.paid_at, oh.created_at) DESC`);
    for (const order of orders) {
      order.items = await (this as any).all(`SELECT ohi.*, mi.name, mi.description FROM order_history_items ohi JOIN menu_items mi ON ohi.menu_item_id = mi.id WHERE ohi.order_history_id = $1`, [order.id]);
      const partials = await (this as any).all('SELECT cash, credit_kart, ticket FROM partial_orders WHERE order_history_id = $1', [order.id]);
      order.partialPayments = partials;
    }
    return orders;
  };

  proto.recordPartialPayment = async function (this: DatabaseManager, orderHistoryId: number, cash: number, credit_kart: number, ticket: number) {
    await (this as any).run('INSERT INTO partial_orders (order_history_id, cash, credit_kart, ticket) VALUES ($1,$2,$3,$4)',[orderHistoryId, cash, credit_kart, ticket]);
  };

  // Customer order history (all or by specific customer if provided)
  proto.getCustomerOrderHistory = async function (this: DatabaseManager, customerId?: number) {
    const params: any[] = [];
    let where = 'WHERE oh.customer_id IS NOT NULL';
    if (customerId) { where += ' AND oh.customer_id = $1'; params.push(customerId); }
    const orders = await (this as any).all(
      `SELECT oh.*, COALESCE(oh.paid_at, oh.created_at) AS created_at,
              c.customer_name as customer_name
       FROM order_history oh
       LEFT JOIN customers c ON c.id = oh.customer_id
       ${where}
       ORDER BY COALESCE(oh.paid_at, oh.created_at) DESC`,
      params
    );
    for (const order of orders) {
      order.items = await (this as any).all(
        `SELECT ohi.*, mi.name, mi.description
         FROM order_history_items ohi
         JOIN menu_items mi ON ohi.menu_item_id = mi.id
         WHERE ohi.order_history_id = $1`,
        [order.id]
      );
    }
    return orders;
  };

  // List customer's unpaid debt orders from history
  proto.getCustomerDebts = async function (this: DatabaseManager, customerId: number) {
    const orders = await (this as any).all(
      `SELECT oh.*, (
         SELECT COALESCE(SUM(cash + credit_kart + ticket),0)
         FROM partial_orders po WHERE po.order_history_id = oh.id
       ) as partial_paid
       FROM order_history oh
       WHERE oh.customer_id = $1 AND (oh.payment_method = 'borc' OR oh.payment_status = 'debt')
       ORDER BY oh.created_at DESC`,
      [customerId]
    );
    return orders;
  };

  // Settle selected debt orders by updating payment_method and payment_status in order_history
  proto.settleCustomerDebts = async function (this: DatabaseManager, data: { customerId: number; orderHistoryIds: number[]; method: string }) {
    if (!data.orderHistoryIds || data.orderHistoryIds.length === 0) return true;
    const ids = data.orderHistoryIds;
    const now = (this as any).getTurkeyDateTime();
    // Update method and status to paid; paid_amount remains historical; partials kept as-is
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
    await (this as any).run(
      `UPDATE order_history SET payment_method = $1, payment_status = 'paid', paid_at = $${ids.length + 2}
       WHERE customer_id = $${ids.length + 3} AND id IN (${placeholders}) AND (payment_method = 'borc' OR payment_status = 'debt')`,
      [data.method, ...ids, now, data.customerId]
    );
    return true;
  };
}
