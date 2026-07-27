import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shown on the dashboard when the portfolio has no holdings yet. */
export function DashboardEmptyState() {
  return (
    <Card className="mt-8">
      <CardHeader className="items-center text-center">
        <CardTitle>No holdings yet</CardTitle>
        <CardDescription>
          Deposit cash on Portfolios, then buy your first stock.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <Link href="/portfolios" className={cn(buttonVariants())}>
          Go to Portfolios
        </Link>
      </CardContent>
    </Card>
  );
}
