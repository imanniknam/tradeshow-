import { cn } from "@/lib/utils";
import type { UserDto } from "@/lib/types";

const PALETTE = [
  "bg-sky-100 text-sky-800",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-violet-100 text-violet-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
] as const;

interface UserAvatarProps {
  user: UserDto;
  size?: "sm" | "md";
  className?: string;
}

/** Initials badge with a stable per-user colour. Decorative: the name is always shown next to it. */
export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        size === "sm" ? "size-6 text-[11px]" : "size-9 text-sm",
        PALETTE[user.id % PALETTE.length],
        className,
      )}
    >
      {user.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
