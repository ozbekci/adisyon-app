import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';


interface FeatureFlags { mobileEnabled: boolean; }

const SettingsPage: React.FC = () => {
  const { currentUser } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const [flags, setFlags] = useState<FeatureFlags>({ mobileEnabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = 'http://localhost:4000'; // TODO: env / dynamic

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/features/mobile`);
      setFlags(res.data.data);
    } catch (e:any) { setError(e.message); } finally { setLoading(false); }
  };

  const toggleMobile = async () => {
    try {
      setSaving(true);
      const next = !flags.mobileEnabled;
      const res = await axios.put(`${baseUrl}/features/mobile`, { mobileEnabled: next });
      setFlags(res.data.data);
    } catch (e:any) { setError(e.message); } finally { setSaving(false); }
  };

  useEffect(() => { load(); }, []);

  if (currentUser?.role !== 'manager') {
    return <div className="flex items-center justify-center h-full text-white">Yetkisiz</div>;
  }

  if (loading) return <div className="text-white">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Ayarlar</h1>
          <p className="text-white/70 text-sm">Sistem özelliklerini yönetin</p>
        </div>
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary inline-flex items-center gap-2">
            Geri
          </button>
        </div>
      </div>
      {error && <div className="text-rose-300 text-sm">{error}</div>}
      <div className="card p-5 space-y-4">
        <h2 className="text-lg font-semibold text-white">Mobil Garson</h2>
        <p className="text-white/60 text-sm">Mobil uygulamanın erişimini kontrol edin.</p>
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${flags.mobileEnabled ? 'text-emerald-300' : 'text-white/50'}`}>Durum: {flags.mobileEnabled ? 'Aktif' : 'Pasif'}</span>
          <button disabled={saving} onClick={toggleMobile} className="btn-primary">
            {saving ? 'Kaydediliyor...' : (flags.mobileEnabled ? 'Pasif Yap' : 'Aktif Et')}
          </button>
        </div>
      </div>
      {/* Gelecekte başka feature switchleri buraya eklenebilir */}
    </div>
  );
};

export default SettingsPage;
