import { redirect } from "next/navigation";

import { AddAssetClassCard } from "@/components/holdings/add-asset-class-card";
import { AssetSectionHeader } from "@/components/holdings/asset-section-header";
import { BasicHoldingsTable } from "@/components/holdings/basic-holdings-table";
import { BuyStockDialog } from "@/components/holdings/buy-stock-dialog";
import { BuyTreasuryDialog } from "@/components/holdings/buy-treasury-dialog";
import { CashBalanceStrip } from "@/components/holdings/cash-balance-strip";
import { HoldingsEmptyState } from "@/components/holdings/holdings-empty-state";
import { HoldingsErrorState } from "@/components/holdings/holdings-error-state";
import { HoldingsTable } from "@/components/holdings/holdings-table";
import { TreasuriesTable } from "@/components/holdings/treasuries-table";
import { TransactionsActivity } from "@/components/holdings/transactions-activity";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAccount } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { getHoldings, getHoldingsPerformance } from "@/lib/api/holdings";
import {
  getTreasuryPerformance,
  listTreasuries,
} from "@/lib/api/treasury";
import { listTransactions } from "@/lib/api/transactions";
import type { Holding, HoldingPerformance } from "@/types/holding";
import type { Transaction } from "@/types/transaction";
import type { TreasuryHolding, TreasuryValuation } from "@/types/treasury";

/**
 * Portfolios page — progressive UX:
 * 1) Fund cash
 * 2) Buy inside each asset section
 * 3) Activity stays collapsed until needed
 */
export default async function PortfoliosPage() {
  let holdings: Holding[] = [];
  let performance: HoldingPerformance[] | null = null;
  let treasuries: TreasuryHolding[] = [];
  let treasuryVals: TreasuryValuation[] | null = null;
  let cashBalance = 0;
  let transactions: Transaction[] = [];
  let errorMessage: string | null = null;
  let priceWarning: string | null = null;
  let treasuryPricingUnavailable = false;

  try {
    const [account, holdingsData, txs, treasuryData] = await Promise.all([
      getAccount(),
      getHoldings(),
      listTransactions(),
      listTreasuries(),
    ]);
    cashBalance = parseFloat(account.cash_balance);
    holdings = holdingsData;
    transactions = txs;
    treasuries = treasuryData;

    if (holdings.length > 0) {
      try {
        performance = await getHoldingsPerformance();
      } catch (error) {
        priceWarning =
          error instanceof ApiError
            ? error.message
            : "Live prices are temporarily unavailable. Showing cost basis only.";
      }
    }

    if (treasuries.length > 0) {
      try {
        treasuryVals = await getTreasuryPerformance();
      } catch {
        treasuryPricingUnavailable = true;
        treasuryVals = null;
      }
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "Could not reach the backend. Is it running on port 8000?";
  }

  const hasStocks = holdings.length > 0;
  const hasTreasuries = treasuries.length > 0;
  const isEmpty = !errorMessage && !hasStocks && !hasTreasuries;

  return (
    <div className="mx-auto flex max-w-6xl flex-1 flex-col px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolios</h1>
      </div>

      {errorMessage && <HoldingsErrorState message={errorMessage} />}

      {!errorMessage && <CashBalanceStrip cashBalance={cashBalance} />}

      {!errorMessage && priceWarning && (
        <Alert className="mt-6">
          <AlertTitle>Live prices unavailable</AlertTitle>
          <AlertDescription>{priceWarning}</AlertDescription>
        </Alert>
      )}

      {isEmpty && <HoldingsEmptyState cashBalance={cashBalance} />}

      {!errorMessage && hasStocks && (
        <section className="mt-10">
          <AssetSectionHeader
            title="Stocks"
            description="Equity holdings with live market prices"
            action={
              <BuyStockDialog
                cashBalance={cashBalance}
                label="Buy stock"
                variant="default"
              />
            }
          />
          {performance ? (
            <HoldingsTable holdings={performance} className="mt-0" />
          ) : (
            <BasicHoldingsTable holdings={holdings} className="mt-0" />
          )}
        </section>
      )}

      {!errorMessage && hasTreasuries && (
        <section className="mt-10">
          <AssetSectionHeader
            title="Treasuries"
            description="US bills, notes, and bonds"
            action={
              <BuyTreasuryDialog
                cashBalance={cashBalance}
                label="Buy Treasury"
                variant="default"
              />
            }
          />
          <TreasuriesTable
            holdings={treasuries}
            valuations={treasuryVals}
            pricingUnavailable={treasuryPricingUnavailable}
          />
        </section>
      )}

      {/* Offer the missing asset class without a big empty table */}
      {!errorMessage && hasStocks && !hasTreasuries && (
        <AddAssetClassCard cashBalance={cashBalance} assetClass="treasury" />
      )}
      {!errorMessage && hasTreasuries && !hasStocks && (
        <AddAssetClassCard cashBalance={cashBalance} assetClass="stock" />
      )}

      {!errorMessage && (
        <TransactionsActivity transactions={transactions} />
      )}
    </div>
  );
}
