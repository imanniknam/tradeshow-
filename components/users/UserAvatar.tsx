import { cn } from "@/lib/utils";
import type { UserDto } from "@/lib/types";

/** Muted tints: distinguishable at a glance without turning the page into a rainbow. */
const PALETTE = [
  "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
  "bg-lime-100 text-lime-800 dark:bg-lime-400/15 dark:text-lime-200",
] as const;

const SIZES = {
  xs: "size-5 text-[10px]",
  sm: "size-6 text-[11px]",
  md: "size-8 text-xs",
  lg: "size-9 text-sm",
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
