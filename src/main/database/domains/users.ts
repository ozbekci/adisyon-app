import { DatabaseManager, User } from '../DatabaseManager';
import bcrypt from 'bcrypt';

export function registerUserDomain(proto: typeof DatabaseManager.prototype) {
  proto.authenticateUser = async function (this: DatabaseManager, username: string, password: string): Promise<User | null> {
  // Bcrypt-only auth
  const user = await this.get('SELECT * FROM users WHERE username = $1 AND is_active = $2', [username, true]);
    if (!user) return null;
    // Migration safety: if legacy admin exists without a hash, backfill default '123456'
    if (!user.password_hash && user.username === 'admin') {
      try {
        const defaultHash = await bcrypt.hash('123456', 10);
        await this.run('UPDATE users SET password_hash = $1 WHERE id = $2', [defaultHash, user.id]);
        user.password_hash = defaultHash;
        console.log('authenticateUser: Backfilled admin password_hash');
      } catch {}
    }
  let ok = false;
  try { ok = await bcrypt.compare(password, user.password_hash); } catch { ok = false; }
    if (!ok) return null;
    const turkeyDateTime = (this as any).getTurkeyDateTime();
    await this.run('UPDATE users SET last_login = $1 WHERE id = $2', [turkeyDateTime, user.id]);
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    };
  };

  proto.getUsers = async function (this: DatabaseManager): Promise<User[]> {
    const users = await this.all('SELECT * FROM users ORDER BY created_at DESC');
    return users.map((user: any) => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));
  };

  proto.createUser = async function (this: DatabaseManager, userData: { username: string; password: string; fullName: string; role: string }): Promise<User> {
    const hash = await bcrypt.hash(userData.password, 10);
    const result = await this.run('INSERT INTO users (username, password_hash, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id',[userData.username, hash, userData.fullName, userData.role]);
    return await (this as any).getUserById(result.id);
  };

  proto.updateUser = async function (
    this: DatabaseManager,
    id: number,
    userData: { username?: string; password?: string; fullName?: string; role?: 'manager'|'cashier'|'waiter'; isActive?: boolean }
  ): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.username) { updates.push('username = $' + (values.length + 1)); values.push(userData.username); }
    if (userData.password) {
      const hash = await bcrypt.hash(userData.password, 10);
  updates.push('password_hash = $' + (values.length + 1)); values.push(hash);
    }
    if (userData.fullName) { updates.push('full_name = $' + (values.length + 1)); values.push(userData.fullName); }
    if (userData.role) { updates.push('role = $' + (values.length + 1)); values.push(userData.role); }
    if (userData.isActive !== undefined) { updates.push('is_active = $' + (values.length + 1)); values.push(!!userData.isActive); }

    if (updates.length === 0) return (this as any).getUserById(id);
    values.push(id);
    await this.run(`UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}` , values);
    return await (this as any).getUserById(id);
  };

  proto.deleteUser = async function (this: DatabaseManager, id: number): Promise<boolean> {
    const result = await this.run('UPDATE users SET is_active = $1 WHERE id = $2', [false, id]);
    return result.changes > 0;
  };

  // Hard delete user (permanent)
  proto.deleteUserHard = async function (this: DatabaseManager, id: number): Promise<boolean> {
    const result = await this.run('DELETE FROM users WHERE id = $1', [id]);
    return result.changes > 0;
  };
}
