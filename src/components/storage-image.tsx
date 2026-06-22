import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "portal-media";

export function useSignedUrl(path?: string | null) {
  return useQuery({
    enabled: !!path,
    queryKey: ["signed-url", path],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from(BUCKET)
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
}: {
  path?: string | null;
  alt: string;
  className?: string;
}) {
  const { data: url } = useSignedUrl(path);
  if (!path || !url) return null;
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}