import { DatabaseManager } from '../DatabaseManager';

export function registerCashSessionDomain(proto: typeof DatabaseManager.prototype) {
  (proto as any).getOpenCashSessionInternal = async function (this: DatabaseManager) {
    return await (this as any).get('SELECT * FROM cash_sessions WHERE is_open = true ORDER BY id DESC LIMIT 1');
  };

  proto.getCashStatus = async function (this: DatabaseManager) {
    const session = await (this as any).getOpenCashSessionInternal();
    return { isOpen: !!session, session };
  };

  proto.openCashSession = async function (this: DatabaseManager, openingUser: string, openingAmount: number) {
    const open = await (this as any).getOpenCashSessionInternal();
    if (open) throw new Error('Zaten açık bir kasa oturumu var');
    const now = (this as any).getTurkeyDateTime();
    const res = await (this as any).run('INSERT INTO cash_sessions (opened_at, opening_user, opening_amount) VALUES ($1, $2, $3) RETURNING id',[now, openingUser, openingAmount || 0]);
    return { id: res.id, opened_at: now, opening_amount: openingAmount };
  };

  proto.closeCashSession = async function (this: DatabaseManager, closingUser: string, realCashCounted: number) {
    const open = await (this as any).getOpenCashSessionInternal();
    if (!open) throw new Error('Açık kasa oturumu bulunamadı');
    const now = (this as any).getTurkeyDateTime();
    const cashRowOrders = await (this as any).get('SELECT COALESCE(SUM(paid_amount), 0) as total FROM orders WHERE payment_method = $1 AND paid_at BETWEEN $2 AND $3',[ 'nakit', open.opened_at, now ]);
    const cardRowOrders = await (this as any).get('SELECT COALESCE(SUM(paid_amount), 0) as total FROM orders WHERE payment_method = $1 AND paid_at BETWEEN $2 AND $3',[ 'kredi-karti', open.opened_at, now ]);
    const cashRowHistory = await (this as any).get('SELECT COALESCE(SUM(paid_amount), 0) as total FROM order_history WHERE payment_method = $1 AND paid_at BETWEEN $2 AND $3',[ 'nakit', open.opened_at, now ]);
    const cardRowHistory = await (this as any).get('SELECT COALESCE(SUM(paid_amount), 0) as total FROM order_history WHERE payment_method = $1 AND paid_at BETWEEN $2 AND $3',[ 'kredi-karti', open.opened_at, now ]);
    const cashTotal = (cashRowOrders.total || 0) + (cashRowHistory.total || 0);
    const cardTotal = (cardRowOrders.total || 0) + (cardRowHistory.total || 0);
    const expectedCash = (open.opening_amount || 0) + cashTotal;
    console.log('Expected cash:', expectedCash);
    const difference = (realCashCounted || 0) - expectedCash;
    console.log('Difference:', difference);
    await (this as any).run('UPDATE cash_sessions SET closed_at = $1, is_open = $2, closing_user = $3, cash_total = $4, card_total = $5, real_cash_counted = $6, difference = $7 WHERE id = $8',[now, false, closingUser, cashTotal, cardTotal, realCashCounted || 0, difference, open.id]);
    return { cashTotal, cardTotal, session: { ...open, closed_at: now, cash_total: cashTotal, card_total: cardTotal, real_cash_counted: realCashCounted || 0, difference } };
  };
}
