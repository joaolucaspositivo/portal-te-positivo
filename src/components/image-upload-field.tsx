import { ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { getAccessToken } from "@/lib/auth-attacher.local";
import { useSignedUrl } from "./storage-image";

function isLikelyImageValue(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("data:") ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(value)
  );
}

export function ImageUploadField({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  bucket?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: previewUrl } = useSignedUrl(value);

  const [uploading, setUploading] = useState(false);

  function updateValue(nextValue: string) {
    const normalized = nextValue.trim();

    if (!normalized) {
      onChange(null);
      return;
    }

    if (!isLikelyImageValue(normalized)) {
      toast.warning("Use uma URL completa ou um caminho de imagem válido.");
    }

    onChange(normalized);
  }

  async function uploadFile(file: File) {
    const token = getAccessToken();

    if (!token) {
      toast.error("Faça login novamente para enviar arquivos.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("folder", folder);

    setUploading(true);

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.ok || !result?.path) {
        throw new Error(result?.message ?? "Não foi possível enviar o arquivo.");
      }

      onChange(result.path);
      toast.success("Arquivo enviado com sucesso.");
    } catch (error: any) {
      toast.error(error?.message ?? "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      {value && previewUrl ? (
        <div className="relative inline-block">
          <img src={previewUrl} alt="Pré-visualização" className="max-h-40 rounded-md border" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow"
            aria-label="Remover imagem"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          Nenhuma imagem informada.
        </div>
      )}

      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              uploadFile(file);
            }
          }}
          className="hidden"
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm font-medium disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Enviando..." : "Enviar arquivo"}
        </button>

        <input
          value={value ?? ""}
          onChange={(e) => updateValue(e.target.value)}
          placeholder="https://exemplo.com/imagem.png ou /uploads/ferramentas/arquivo.png"
          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Envie uma imagem/PDF de até 5MB ou informe uma URL/caminho manualmente.
      </p>
    </div>
  );
}