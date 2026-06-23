import { ChangeEvent } from "react";

export type DynamicField = {
  id: string;
  chave: string;
  label: string;
  tipo_campo: string;
  obrigatorio: boolean;
  placeholder: string | null;
  help_text: string | null;
  opcoes: unknown;
};

const inp = "w-full px-3 py-2 rounded-md border bg-background text-sm";

export function DynamicFormFields({
  fields,
  values,
  onChange,
}: {
  fields: DynamicField[];
  values: Record<string, any>;
  onChange: (k: string, v: any) => void;
}) {
  return (
    <>
      {fields.map((f) => {
        const id = `df-${f.id}`;
        const v = values[f.chave];
        const opts = Array.isArray(f.opcoes) ? (f.opcoes as string[]) : [];
        const set = (val: any) => onChange(f.chave, val);
        const handle = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
          set(e.target.value);

        return (
          <label key={f.id} htmlFor={id} className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium">
              {f.label}
              {f.obrigatorio && <span className="text-destructive"> *</span>}
            </span>
            {f.tipo_campo === "textarea" ? (
              <textarea id={id} rows={4} required={f.obrigatorio} value={v ?? ""} onChange={handle} placeholder={f.placeholder ?? ""} className={inp} />
            ) : f.tipo_campo === "select" ? (
              <select id={id} required={f.obrigatorio} value={v ?? ""} onChange={handle} className={inp}>
                <option value="">Selecione…</option>
                {opts.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.tipo_campo === "multiselect" ? (
              <div className="flex flex-wrap gap-2">
                {opts.map((o) => {
                  const arr: string[] = Array.isArray(v) ? v : [];
                  const on = arr.includes(o);
                  return (
                    <button type="button" key={o}
                      onClick={() => set(on ? arr.filter((x) => x !== o) : [...arr, o])}
                      className={`px-3 py-1.5 rounded-full text-xs border ${on ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}>
                      {o}
                    </button>
                  );
                })}
              </div>
            ) : f.tipo_campo === "checkbox" ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <input id={id} type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} />
                {f.placeholder || "Sim"}
              </label>
            ) : (
              <input id={id} type={mapType(f.tipo_campo)} required={f.obrigatorio} value={v ?? ""} onChange={handle} placeholder={f.placeholder ?? ""} className={inp} />
            )}
            {f.help_text && <span className="text-xs text-muted-foreground">{f.help_text}</span>}
          </label>
        );
      })}
    </>
  );
}

function mapType(t: string) {
  switch (t) {
    case "email": return "email";
    case "url": return "url";
    case "number": return "number";
    case "date": return "date";
    default: return "text";
  }
}