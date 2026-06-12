import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = "Delete", loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle size={26} className="text-red-400" />
        </div>
        <div>
          <h3 className="font-syne text-lg font-bold text-white mb-1">{title}</h3>
          <p className="font-dm text-sm text-slate-400">{message}</p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 font-dm px-5 py-2.5
              rounded-xl transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-50
              flex items-center justify-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
