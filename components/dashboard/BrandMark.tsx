import { cn } from "@/lib/utils";

/** A "%"-like glyph: two parties and the line that splits what they share. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("size-7 shrink-0", className)}>
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <g className="fill-primary-foreground stroke-primary-foreground">
        <path d="M7.5 16.5 16.5 7.5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8.25" cy="8.25" r="1.9" stroke="none" />
        <circle cx="15.75" cy="15.75" r="1.9" stroke="none" />
      </g>
    </svg>
  );
}
