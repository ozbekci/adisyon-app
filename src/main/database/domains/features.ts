import { DatabaseManager } from '../DatabaseManager';

export function registerFeatureDomain(proto: typeof DatabaseManager.prototype) {
  proto.getFeatureFlags = async function (this: DatabaseManager): Promise<{ mobileEnabled: boolean }> {
    const row = await (this as any).get('SELECT mobile_enabled FROM features LIMIT 1');
    return { mobileEnabled: !!row?.mobile_enabled };
  };

  proto.setMobileEnabled = async function (this: DatabaseManager, enabled: boolean) {
    await (this as any).run('UPDATE features SET mobile_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM features LIMIT 1)', [enabled]);
  };
}
