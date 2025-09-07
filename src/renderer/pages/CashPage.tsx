import React from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import CashSessionModal from "../components/CashSessionModal";

const CashPage: React.FC = () => {
  const { mode } = useParams();
  const { currentUser } = useSelector((s: RootState) => s.auth);

  const handleSubmit = async (data: any) => {
    try {
      if (mode === "open") {
        await (window as any).electronAPI.openCashSession({ user: currentUser?.username || "system", openingAmount: data.openingAmount });
        alert("Kasa açıldı");
      } else {
        const auth = await (window as any).electronAPI.authenticateUser(data.managerUser, data.managerPass);
        if (!auth || auth.role !== "manager") {
          alert("Yetkisiz kullanıcı veya yanlış şifre");
          return;
        }
        const res = await (window as any).electronAPI.closeCashSession({ user: data.managerUser, realCash: data.realCash });
        const diff = res.difference ?? res.session?.difference ?? 0;
        alert(`Kasa kapatıldı.\nSistem Nakit: ₺${(res.cashTotal ?? 0).toFixed(2)}\nKart: ₺${(res.cardTotal ?? 0).toFixed(2)}\nSayılan: ₺${data.realCash.toFixed(2)}\nFark: ₺${diff.toFixed(2)}`);
      }
    } catch (err: any) {
      alert(err.message || err);
    } finally {
      window.close();
    }
  };

  return (
    <CashSessionModal mode={mode as any} isOpen={true} onClose={() => window.close()} onSubmit={handleSubmit} />
  );
};

export default CashPage; 