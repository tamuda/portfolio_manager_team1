import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type HoldingsErrorStateProps = {
  message: string;
};

/**
 * Shown when the frontend cannot reach the backend API.
 * Gives the developer/user a clear next step instead of a blank page.
 */
export function HoldingsErrorState({ message }: HoldingsErrorStateProps) {
  return (
    <Alert variant="destructive" className="mt-8">
      <AlertCircleIcon />
      <AlertTitle>Could not load holdings</AlertTitle>
      <AlertDescription>
        <p>{message}</p>
        <p className="mt-2 text-sm">
          Make sure the backend is running:{" "}
          <code className="rounded bg-destructive/10 px-1 py-0.5 text-xs">
            uvicorn app.main:app --reload
          </code>
        </p>
      </AlertDescription>
    </Alert>
  );
}
