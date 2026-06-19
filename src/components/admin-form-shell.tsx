import { ReactNode } from "react";
import { X } from "lucide-react";

export function AdminFormShell({
  title, onClose, children, onSubmit, loading,
}: {
  title: string; onClose: () => void; children: ReactNode;
  onSubmit: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="w-full max-w-2xl bg-card rounded-xl border shadow-xl my-8">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="p-5 space-y-4"
        >
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
                    className="px-4 py-2 rounded-md border text-sm">Cancelar</button>
            <button type="submit" disabled={loading}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export const inpCls = "px-3 py-2 rounded-md border bg-background text-sm w-full";