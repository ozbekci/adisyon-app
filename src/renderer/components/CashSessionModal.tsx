import React, { useState } from "react";

interface CashSessionModalProps {
  mode: "open" | "close";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CashSessionModal: React.FC<CashSessionModalProps> = ({ mode, isOpen, onClose, onSubmit }) => {
  const [openingAmount, setOpeningAmount] = useState("0");
  const [realCash, setRealCash] = useState("0");
  const [managerUser, setManagerUser] = useState("");
  const [managerPass, setManagerPass] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (mode === "open") {
      const amount = parseFloat(openingAmount) || 0;
      onSubmit({ openingAmount: amount });
    } else {
      const real = parseFloat(realCash) || 0;
      onSubmit({ realCash: real, managerUser, managerPass });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card w-full max-w-sm p-6 space-y-5">
        <h2 className="text-xl font-semibold text-white">
          {mode === "open" ? "Kasa Açılışı" : "Kasa Kapanışı"}
        </h2>

        {mode === "open" ? (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Açılış Nakit Miktarı (₺)
            </label>
            <input
              type="number"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              className="input focus:ring-blue-500 placeholder-white/40"
              min="0"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Kasadaki Şuanki Nakit Miktarı (₺)
              </label>
              <input
                type="number"
                value={realCash}
                onChange={(e) => setRealCash(e.target.value)}
                className="input focus:ring-blue-500 placeholder-white/40"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Yetkili Kullanıcı Adı
              </label>
              <input
                type="text"
                value={managerUser}
                onChange={(e) => setManagerUser(e.target.value)}
                className="input focus:ring-blue-500 placeholder-white/40"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Şifre
              </label>
              <input
                type="password"
                value={managerPass}
                onChange={(e) => setManagerPass(e.target.value)}
                className="input focus:ring-blue-500 placeholder-white/40"
              />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/15 transition"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm"
          >
            Onayla
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashSessionModal;