/**
 * Section header with the buy action scoped to that asset class.
 */

import type { ReactNode } from "react";

type AssetSectionHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function AssetSectionHeader({
  title,
  description,
  action,
}: AssetSectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
