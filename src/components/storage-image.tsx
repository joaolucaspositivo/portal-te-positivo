function resolveImageSrc(path?: string | null) {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("/") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return `/${path.replace(/^\/+/, "")}`;
}

export function useSignedUrl(path?: string | null) {
  return {
    data: resolveImageSrc(path),
    isLoading: false,
    error: null,
  };
}

export function StorageImage({
  path,
  alt,
  className,
}: {
  path?: string | null;
  alt: string;
  className?: string;
  bucket?: string;
}) {
  const src = resolveImageSrc(path);

  if (!src) return null;

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}