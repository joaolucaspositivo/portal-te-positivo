import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fileUrl } from "./storage-image";
import { getAccessToken } from "@/lib/auth-attacher.local";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageUploadField({
  folder,
  value,
  onChange,
  bucket = "portal-media",
}: {
  folder?: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  bucket?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = fileUrl(value, bucket);

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
      const form = new FormData();
      form.append("bucket", bucket);
      form.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${getAccessToken() ?? ""}` },
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      const result = (await res.json()) as { path: string };
      onChange(result.path);
      toast.success("Imagem enviada.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  function remove() {
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
