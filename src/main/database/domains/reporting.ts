import { DatabaseManager } from '../DatabaseManager';

export function registerReportingDomain(proto: typeof DatabaseManager.prototype) {
  proto.getProductSales = async function (this: DatabaseManager, { start, end, orderBy = 'revenue' }: { start?: string; end?: string; orderBy?: 'quantity' | 'revenue' }) {
    const where: string[] = []; const params: any[] = [];
    if (start) { where.push('oh.created_at >= $1'); params.push(start + ' 00:00:00'); }
    if (end) { where.push(`oh.created_at <= $${params.length + 1}`); params.push(end + ' 23:59:59'); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const query = `SELECT mi.id as menu_item_id, mi.name as name, SUM(ohi.quantity) as total_quantity, SUM(ohi.quantity * ohi.price) as total_revenue, CASE WHEN SUM(ohi.quantity) > 0 THEN SUM(ohi.quantity * ohi.price)::float / SUM(ohi.quantity) ELSE 0 END as avg_price FROM order_history_items ohi JOIN order_history oh ON ohi.order_history_id = oh.id JOIN menu_items mi ON ohi.menu_item_id = mi.id ${whereClause} GROUP BY mi.id, mi.name ORDER BY ${orderBy === 'quantity' ? 'total_quantity' : 'total_revenue'} DESC`;
    const rows = await (this as any).all(query, params);
    return rows.map((r: any) => ({ menu_item_id: r.menu_item_id, name: r.name, total_quantity: Number(r.total_quantity)||0, total_revenue: Number(r.total_revenue)||0, avg_price: Number(r.avg_price)||0 }));
  };

  proto.getRevenueData = async function (this: DatabaseManager, params: { start?: string; end?: string; groupBy?: 'day' | 'month' | 'year' } = {}) {
    const { start, end, groupBy = 'day' } = params;
    const conditions: string[] = []; const values: any[] = [];
    if (start) { conditions.push('oh.created_at >= $' + (values.length + 1)); values.push(start); }
    if (end) { conditions.push('oh.created_at <= $' + (values.length + 1)); values.push(end + ' 23:59:59'); }
    let dateFormat = 'YYYY-MM-DD'; let query = '';
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    if (groupBy === 'month') {
      dateFormat = 'YYYY-MM';
      query = `SELECT TO_CHAR(oh.created_at, '${dateFormat}') AS date, COALESCE(SUM(ohi.quantity),0) AS total_quantity, COALESCE(SUM(ohi.quantity * ohi.price),0) AS total_revenue, MIN(EXTRACT(DAY FROM oh.created_at)) AS min_day, MAX(EXTRACT(DAY FROM oh.created_at)) AS max_day FROM order_history_items ohi JOIN order_history oh ON ohi.order_history_id = oh.id JOIN menu_items mi ON ohi.menu_item_id = mi.id ${whereClause} GROUP BY date ORDER BY date ASC`;
    } else if (groupBy === 'year') {
      dateFormat = 'YYYY';
      query = `SELECT TO_CHAR(oh.created_at, '${dateFormat}') AS date, COALESCE(SUM(ohi.quantity),0) AS total_quantity, COALESCE(SUM(ohi.quantity * ohi.price),0) AS total_revenue FROM order_history_items ohi JOIN order_history oh ON ohi.order_history_id = oh.id JOIN menu_items mi ON ohi.menu_item_id = mi.id ${whereClause} GROUP BY date ORDER BY date ASC`;
    } else {
      query = `SELECT TO_CHAR(oh.created_at, '${dateFormat}') AS date, COALESCE(SUM(ohi.quantity),0) AS total_quantity, COALESCE(SUM(ohi.quantity * ohi.price),0) AS total_revenue FROM order_history_items ohi JOIN order_history oh ON ohi.order_history_id = oh.id JOIN menu_items mi ON ohi.menu_item_id = mi.id ${whereClause} GROUP BY date ORDER BY date ASC`;
    }
    return await (this as any).all(query, values);
  };
}
