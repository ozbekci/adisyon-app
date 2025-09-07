import { DatabaseManager, Customer } from '../DatabaseManager';

export function registerCustomerDomain(proto: typeof DatabaseManager.prototype) {
  proto.getCustomers = async function (this: DatabaseManager): Promise<Customer[]> {
    const customers = await (this as any).all('SELECT * FROM customers ORDER BY customer_name');
    return customers.map((c: any) => ({ id: c.id, customerName: c.customer_name, address: c.address, telephoneNumber: c.telephone_number, createdAt: c.created_at }));
  };

  proto.getCustomersWithDebt = async function (this: DatabaseManager) {
    const rows = await (this as any).all(`SELECT oh.customer_id as id, c.customer_name as "customerName", SUM(oh.total) as debt
      FROM order_history oh
      JOIN customers c ON oh.customer_id = c.id
      WHERE oh.payment_method = 'borc' AND oh.customer_id IS NOT NULL
      GROUP BY oh.customer_id, c.customer_name
      HAVING SUM(oh.total) > 0
      ORDER BY debt DESC`);
    return rows;
  };

  proto.createCustomer = async function (this: DatabaseManager, customerData: { customerName: string; address?: string; telephoneNumber?: string }): Promise<Customer> {
    const turkeyDateTime = (this as any).getTurkeyDateTime();
    const result = await (this as any).run('INSERT INTO customers (customer_name, address, telephone_number, created_at) VALUES ($1,$2,$3,$4) RETURNING id',[customerData.customerName, customerData.address || null, customerData.telephoneNumber || null, turkeyDateTime]);
    return await (this as any).getCustomerById(result.id);
  };

  proto.updateCustomer = async function (this: DatabaseManager, id: number, data: Partial<Customer>): Promise<Customer> {
    const updates: string[] = []; const values: any[] = [];
    if (data.customerName !== undefined) { updates.push('customer_name = $' + (values.length + 1)); values.push(data.customerName); }
    if (data.address !== undefined) { updates.push('address = $' + (values.length + 1)); values.push(data.address); }
    if (data.telephoneNumber !== undefined) { updates.push('telephone_number = $' + (values.length + 1)); values.push(data.telephoneNumber); }
    if (!updates.length) return await (this as any).getCustomerById(id);
    values.push(id);
    await (this as any).run(`UPDATE customers SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    return await (this as any).getCustomerById(id);
  };

  proto.deleteCustomer = async function (this: DatabaseManager, id: number): Promise<boolean> {
    const result = await (this as any).run('DELETE FROM customers WHERE id = $1', [id]);
    return result.changes > 0;
  };

  proto.searchCustomers = async function (this: DatabaseManager, term: string): Promise<Customer[]> {
    const customers = await (this as any).all('SELECT * FROM customers WHERE customer_name ILIKE $1 OR telephone_number ILIKE $2 ORDER BY customer_name',[`%${term}%`,`%${term}%`]);
    return customers.map((c: any) => ({ id: c.id, customerName: c.customer_name, address: c.address, telephoneNumber: c.telephone_number, createdAt: c.created_at }));
  };
}
