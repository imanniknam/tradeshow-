import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** White surface used for the main dashboard sections. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("scroll-mt-6 overflow-hidden rounded-xl border bg-card shadow-xs", className)}
      {...props}
    />
  );
}

interface PanelHeaderProps {
  title: string;
  titleId: string;
  description?: string;
  action?: ReactNode;
}

export function PanelHeader({ title, titleId, description, action }: PanelHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <h2 id={titleId} className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}
