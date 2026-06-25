import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
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
  value,
  onChange,
}: {
  folder: string;
  value?: string | null;
  onChange: (path: string | null) => void;
  bucket?: string;
}) {
  const { data: previewUrl } = useSignedUrl(value);

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

  return (
    <div className="space-y-2">
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

      <input
        value={value ?? ""}
        onChange={(e) => updateValue(e.target.value)}
        placeholder="https://exemplo.com/imagem.png ou /imagens/banner.png"
        className="w-full px-3 py-2 rounded-md border bg-background text-sm"
      />

      <p className="text-xs text-muted-foreground">
        Informe uma URL pública ou um caminho local servido pelo app. Upload de arquivo será migrado
        em uma fase própria.
      </p>
    </div>
  );
}