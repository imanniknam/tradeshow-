import { AlertCircleIcon, RotateCwIcon } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/client";

interface QueryErrorProps {
  title: string;
  error: unknown;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function QueryError({ title, error, onRetry, isRetrying }: QueryErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{getErrorMessage(error)}</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={onRetry} disabled={isRetrying}>
          <RotateCwIcon className={isRetrying ? "animate-spin" : undefined} />
          Retry
        </Button>
      </AlertAction>
    </Alert>
  );
}
