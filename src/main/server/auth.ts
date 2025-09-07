import { DatabaseManager } from '../database/DatabaseManager';
import bcrypt from 'bcrypt';

export interface AuthResult {
  user: { id: number; username: string; role: string; fullName: string };
  tokens: { accessToken: string };
  migrated?: boolean;
}

// Bcrypt-only username/password authentication against users.password_hash
export async function authenticate(db: DatabaseManager, username: string, password: string): Promise<AuthResult | null> {
  const raw = await db.getRawUserByUsername(username);
  if (!raw) return null;
  if (raw.is_active === false) return null;


  const ok = raw.password_hash ? await bcrypt.compare(password, raw.password_hash) : false;
  if (!ok) return null;
  const accessToken = Buffer.from(`${raw.id}:${raw.role}:${Date.now()}`).toString('base64');
  return {
    user: { id: raw.id, username: raw.username, role: raw.role, fullName: raw.full_name },
    tokens: { accessToken },
    migrated: !!raw.password_hash
  };
}

export function requireAuth(header?: string) {
  if (!header) return null;
  const parts = header.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [id, role] = decoded.split(':');
    if (!id || !role) return null;
    return { id: Number(id), role };
  } catch {
    return null;
  }
}
