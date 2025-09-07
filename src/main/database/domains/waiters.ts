import { DatabaseManager } from '../DatabaseManager';
import bcrypt from 'bcrypt';

export function registerWaiterDomain(proto: typeof DatabaseManager.prototype) {
  proto.getActiveWaiters = async function (this: DatabaseManager) {
    const rows = await (this as any).all("SELECT id, full_name FROM users WHERE role = 'waiter' AND is_active = true ORDER BY full_name ASC");
    console.log(rows)
    return rows.map((r: any) => ({ id: r.id, name: r.full_name }));
  };

  proto.verifyWaiterPin = async function (this: DatabaseManager, waiterId: number, pin: string) {
  const row = await (this as any).get("SELECT id, username, full_name, password_hash, last_checkin_at FROM users WHERE id = $1 AND role = 'waiter' AND is_active = true", [waiterId]);
  if (!row || !row.password_hash) return { ok: false };
  const pinStr = String(pin ?? '').trim();
  const hashStr = typeof row.password_hash === 'string' ? row.password_hash.trim() : String(row.password_hash);
  let ok = false;
  if (hashStr.startsWith('$2')) {
    // bcrypt hash
    console.log(hashStr)
    console.log(pinStr)
    ok = await bcrypt.compare(pinStr, hashStr);
    console.log(ok)
  } else {
    // Legacy/plain value fallback: compare as-is and migrate to bcrypt
    ok = pinStr === hashStr;
    if (ok) {
      try {
        const newHash = await bcrypt.hash(pinStr, 10);
        await (this as any).run('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, waiterId]);
        if ((this as any).debug) console.log('verifyWaiterPin: migrated plain PIN to bcrypt for waiter', waiterId);
      } catch { /* ignore migration errors */ }
    }
  }
    if (!ok) {
      if ((this as any).debug) console.warn('verifyWaiterPin: PIN mismatch', { waiterId });
      return { ok: false };
    };
    const now = (this as any).getTurkeyDateTime();
    await (this as any).run('UPDATE users SET last_checkin_at = $1 WHERE id = $2', [now, waiterId]);
  return { ok: true, waiter: { id: row.id, name: row.full_name, username: row.username, lastCheckin: now } };
  };

  proto.waiterStatus = async function (this: DatabaseManager, waiterId: number) {
    const row = await (this as any).get("SELECT is_active FROM users WHERE id = $1 AND role = 'waiter'", [waiterId]);
    return { active: !!row?.is_active };
  };

  proto.setWaiterPin = async function (this: DatabaseManager, userId: number, pin: string) {
    const hash = await bcrypt.hash(pin, 10);
    // Store hashed PIN into password_hash since waiter_pin_hash column was removed
    await (this as any).run("UPDATE users SET password_hash = $1 WHERE id = $2 AND role = 'waiter'", [hash, userId]);
    return true;
  };
}
