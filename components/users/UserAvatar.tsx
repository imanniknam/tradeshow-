import { cn } from "@/lib/utils";
import type { UserDto } from "@/lib/types";

const PALETTE = [
  "bg-indigo-500 text-white",
  "bg-emerald-500 text-white",
  "bg-sky-500 text-white",
  "bg-pink-500 text-white",
  "bg-amber-500 text-white",
  "bg-violet-500 text-white",
] as const;

const SIZES = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
} as const;

interface UserAvatarProps {
  user: UserDto;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Initial badge with a stable per-user colour. Decorative: the name is always shown nearby. */
export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        SIZES[size],
        PALETTE[(user.id - 1 + PALETTE.length) % PALETTE.length],
        className,
      )}
    >
      {user.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
