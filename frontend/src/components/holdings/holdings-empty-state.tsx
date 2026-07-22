import { AddHoldingDialog } from "@/components/holdings/add-holding-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Shown when the portfolio has no holdings yet.
 * The primary action opens the same Add dialog used in the page header.
 */
export function HoldingsEmptyState() {
  return (
    <Card className="mt-8">
      <CardHeader className="items-center text-center">
        <CardTitle>No holdings yet</CardTitle>
        <CardDescription>
          Add your first stock to start tracking your portfolio.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <AddHoldingDialog label="Add your first holding" />
      </CardContent>
    </Card>
  );
}
