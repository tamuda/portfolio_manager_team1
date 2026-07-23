"use server";

/**
 * Server Actions for portfolio mutations.
 *
 * Client components (forms, delete buttons) call these functions instead of
 * hitting the API directly. After each mutation we revalidate the page so
 * the Server Component re-fetches fresh holdings data.
 */

import { revalidatePath } from "next/cache";

import { ApiError } from "@/lib/api/client";
import { createHolding, deleteHolding } from "@/lib/api/holdings";
import type { HoldingCreate } from "@/types/holding";

type ActionResult = {
  success: boolean;
  error?: string;
};

/** Create a holding and refresh the portfolios page. */
export async function createHoldingAction(
  input: HoldingCreate,
): Promise<ActionResult> {
  try {
    await createHolding(input);
    revalidatePath("/portfolios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while saving the holding.";

    return { success: false, error: message };
  }
}

/** Delete a holding and refresh the portfolios page. */
export async function deleteHoldingAction(id: number): Promise<ActionResult> {
  try {
    await deleteHolding(id);
    revalidatePath("/portfolios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while deleting the holding.";

    return { success: false, error: message };
  }
}
