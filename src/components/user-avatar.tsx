import { fileUrl } from "./storage-image";
import { cn } from "@/lib/utils";

export function UserAvatar({
  path,
  name,
  size = 36,
  className,
}: {
  path?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const url = fileUrl(path, "portal-avatars");
  const initials = (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-label={name ?? "Avatar"}
    >
      {url ? (
        <img src={url} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
