import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSignedUrl } from "./storage-image";

const BUCKET = "portal-media";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageUploadField({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value?: string | null;
  onChange: (path: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: previewUrl } = useSignedUrl(value);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Formato inválido. Use PNG, JPG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Imagem maior que 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${folder}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      // best-effort cleanup of previous file
      if (value) {
        await supabase.storage.from(BUCKET).remove([value]).catch(() => {});
      }
      onChange(path);
      toast.success("Imagem enviada.");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    if (!value) return;
    await supabase.storage.from(BUCKET).remove([value]).catch(() => {});
    onChange(null);
  }

  return (
    <div className="space-y-2">
      {value && previewUrl ? (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Pré-visualização" className="max-h-40 rounded-md border" />
          <button
            type="button"
            onClick={remove}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow"
            aria-label="Remover imagem"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed text-sm hover:bg-muted disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando…" : "Enviar imagem"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ou GIF · até 5 MB</p>
    </div>
  );
}