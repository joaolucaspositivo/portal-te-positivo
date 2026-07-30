const DEFAULT_BUCKET = "portal-media";

/** Constrói a URL pública servida pelo backend local (/api/files/...). */
export function fileUrl(path?: string | null, bucket: string = DEFAULT_BUCKET) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/api/files/")) return path;
  const clean = path.replace(/^\/+/, "");
  return clean.startsWith(`${bucket}/`) ? `/api/files/${clean}` : `/api/files/${bucket}/${clean}`;
}

/** Compat com o código antigo: devolve { data: url } sem requisição de rede. */
export function useSignedUrl(path?: string | null, bucket: string = DEFAULT_BUCKET) {
  return { data: fileUrl(path, bucket) };
}

export function StorageImage({
  path,
  alt,
  className,
  bucket,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  bucket?: string;
}) {
  const url = fileUrl(path, bucket);
  if (!url) return null;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
