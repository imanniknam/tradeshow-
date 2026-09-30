import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Card surface used for the main sections of the page. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("overflow-hidden rounded-xl border bg-card", className)} {...props} />;
}

interface PanelHeaderProps {
  title: string;
  titleId: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function PanelHeader({ title, titleId, description, action }: PanelHeaderProps) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 id={titleId} className="text-sm font-semibold">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
