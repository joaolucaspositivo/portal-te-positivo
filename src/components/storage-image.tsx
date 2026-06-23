import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_BUCKET = "portal-media";

export function useSignedUrl(path?: string | null, bucket: string = DEFAULT_BUCKET) {
  return useQuery({
    enabled: !!path,
    queryKey: ["signed-url", bucket, path],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60); // 1h
      if (error) throw error;
      return data.signedUrl;
    },
  });
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
  const { data: url } = useSignedUrl(path, bucket);
  if (!path || !url) return null;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}