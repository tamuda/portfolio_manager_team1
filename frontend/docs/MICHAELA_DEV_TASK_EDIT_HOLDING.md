# Michaela's Task: Let Users Edit a Stock Holding

Hi Michaela! This guide walks you through adding an **Edit** button to the portfolio table.

**The problem today:** If someone types the wrong quantity, their only option is to delete the row and add it again.

**What you'll build:** A small **⋯ menu** on each row with **Edit** and **Delete**.

---

## How this guide is organized

We work in **two parts** so you're not jumping around:

| Part                   | What you do                                        | You'll see in the browser  |
| ---------------------- | -------------------------------------------------- | -------------------------- |
| **Part 1** (Steps 1–3) | Build the ⋯ menu and move Delete into it           | ⋯ menu works, Delete works |
| **Part 2** (Steps 4–6) | Hook up Edit so Save actually updates the database | Edit popup + Save works    |

Finish Part 1 and test it before starting Part 2.

---

## A quick picture of how this app works

| Part         | What it is                                            | Where it lives         |
| ------------ | ----------------------------------------------------- | ---------------------- |
| **Frontend** | What you see in the browser (buttons, tables, popups) | This `frontend` folder |
| **Backend**  | Saves data to the database                            | The `backend` folder   |

When you click Save, the frontend sends a message to the backend → database updates → table refreshes.

**Good news:** Delete already talks to the backend. Edit's backend support exists too — you'll connect it in **Part 2**.

---

## Words you might see

| Word               | Plain English                                                                |
| ------------------ | ---------------------------------------------------------------------------- |
| **Component**      | A reusable piece of UI — a button, table, or popup                           |
| **Import**         | At the top of a file: "use code from another file"                           |
| **`"use client"`** | This file runs in the browser (needed for clicks and forms)                  |
| **Dialog / popup** | The box in the middle of the screen                                          |
| **Server Action**  | A save/delete function — Delete already has one; you'll add Edit's in Part 2 |

---

## Before you start

### 1. Start the app

**Terminal 1 — backend:**

```bash
cd backend
docker start portfolio-mysql
source .venv/bin/activate
uvicorn app.main:app --reload
```

**Terminal 2 — frontend:**

```bash
cd frontend
npm run dev
```

Open http://localhost:3000/portfolios

> **First time only:** If `npm run dev` fails, run `cp .env.example .env.local` in the `frontend` folder.

### 2. Files to peek at

| File                                                | What it does                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `src/components/holdings/delete-holding-dialog.tsx` | Delete popup — **already in the repo**, you don't need to create it |
| `src/components/holdings/add-holding-dialog.tsx`    | Add popup — your Edit popup will look similar (Part 2)              |

### 3. Quick test

Add a test stock on `/portfolios`. If you see a new row, you're ready.

---

## What it should look like when you're done

**Before:** `[Delete]` button on each row

**After:** `[ ⋯ ]` menu → **Edit** or **Delete**

---

## How to create a new file

1. Right-click `src/components/holdings` in the sidebar
2. **New File** → type the exact name (e.g. `holding-row-actions.tsx`)
3. Paste the code → **Cmd + S** / **Ctrl + S**

---

# Part 1 — Replace the Delete button with a ⋯ menu

**You're not building Delete from scratch.** Delete already works — there's a red **Delete** button on every row today.

In Part 1 you **move** Delete into a ⋯ menu. The "Are you sure?" popup (`delete-holding-dialog.tsx`) is **already in the repo** — you just plug it into your new menu.

### What you'll build in Part 1

| Step  | What you do                                                       |
| ----- | ----------------------------------------------------------------- |
| **1** | Install the dropdown menu component                               |
| **2** | Create `holding-row-actions.tsx` — the ⋯ button that opens Delete |
| **3** | Swap the red Delete button on the table for your ⋯ menu           |

---

## Step 1 — Install the dropdown menu (the ⋯ button)

In Terminal 2 (`frontend` folder):

```bash
npx shadcn@latest add dropdown-menu
```

Press Enter if it asks questions. You'll get `src/components/ui/dropdown-menu.tsx`.

**Don't edit that file.** You'll use it in Step 2.

If it says the component already exists, move to Step 2.

---

## Step 2 — Create the ⋯ button and menu

**Goal:** Build the three-dot button on each row. We will replace the current **delete** button.

For now the menu only has **Delete**. You'll add **Edit** in Part 2.

### Create: `src/components/holdings/holding-row-actions.tsx`

Paste everything below:

```tsx
"use client";

/**
 * The ⋯ menu on each table row.
 * Part 1: Delete only. Part 2 adds Edit.
 */

import { useState } from "react";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteHoldingDialog } from "@/components/holdings/delete-holding-dialog";
import type { Holding } from "@/types/holding";

type HoldingRowActionsProps = {
  holding: Holding;
};

export function HoldingRowActions({ holding }: HoldingRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${holding.ticker}`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteHoldingDialog
        holding={holding}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
```

Save.

The line `import { DeleteHoldingDialog } from ...` pulls in the popup that's already in the repo. You don't need to create or edit that file.

---

## Step 3 — Swap the red Delete button for your ⋯ menu

**Goal:** The table still shows the old red **Delete** button. Replace it with `HoldingRowActions` from Step 2.

### Why two files?

The app has **two** table components that look almost the same:

| File                       | When it's used                            |
| -------------------------- | ----------------------------------------- |
| `holdings-table.tsx`       | Normal view — shows live stock prices     |
| `basic-holdings-table.tsx` | Backup view — if live prices fail to load |

You need to make the **same swap in both**, so the ⋯ menu works either way. The changes are identical — copy/paste the same edit twice.

---

### 3a. First file: `src/components/holdings/holdings-table.tsx`

**Swap the import** at the top:

```typescript
// Remove this:
import { DeleteHoldingButton } from "@/components/holdings/delete-holding-button";

// Add this:
import { HoldingRowActions } from "@/components/holdings/holding-row-actions";
```

**Swap the Actions cell** (look for the TODO comment):

```tsx
<TableCell className="text-right">
  <HoldingRowActions holding={holding} />
</TableCell>
```

Save.

---

### 3b. Second file: `src/components/holdings/basic-holdings-table.tsx`

Open this file and do **exactly what you did in 3a** — same import swap, same table cell swap.

**Swap the import** at the top:

```typescript
// Remove this:
import { DeleteHoldingButton } from "@/components/holdings/delete-holding-button";

// Add this:
import { HoldingRowActions } from "@/components/holdings/holding-row-actions";
```

**Swap the Actions cell** (look for the TODO comment):

```tsx
<TableCell className="text-right">
  <HoldingRowActions holding={holding} />
</TableCell>
```

Save both files → refresh http://localhost:3000/portfolios

---

## ✅ Part 1 checkpoint — test before continuing

You moved Delete into a menu. Confirm:

- [ ] Red **Delete** button is **gone** — you see **⋯** instead
- [ ] **⋯ → Delete** opens the same "Are you sure?" popup as before
- [ ] Confirming delete still removes the row

**If that works, Part 1 is done.** Part 2 adds **Edit** — a new feature, not another delete.

---

# Part 2 — Connect Edit to the backend

Now the menu works visually. Part 2 adds **Edit**: the popup, the save logic, and one new menu item.

These steps touch files that **talk to the backend** — different from Part 1, but you won't go back and redo the menu. You'll just add to it.

---

## Step 4 — Teach the app how to save edits

Two small changes in existing files. Copy the same pattern Add and Delete already use.

### 4a. Open `src/lib/api/holdings.ts`

**Add `HoldingUpdate` to the import:**

```typescript
import type {
  Holding,
  HoldingCreate,
  HoldingPerformance,
  HoldingUpdate,
} from "@/types/holding";
```

**Find this comment:**

```typescript
// TODO (Michaela): add updateHolding() here
```

**Replace it with:**

```typescript
/** Ask the backend to update one holding. */
export async function updateHolding(
  id: number,
  input: HoldingUpdate,
): Promise<Holding> {
  return apiFetch<Holding>(`${HOLDINGS_PATH}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
```

Save.

### 4b. Open `src/app/portfolios/actions.ts`

**Update the imports at the top:**

```typescript
import {
  createHolding,
  deleteHolding,
  updateHolding,
} from "@/lib/api/holdings";
import type { HoldingCreate, HoldingUpdate } from "@/types/holding";
```

**Paste at the bottom of the file:**

```typescript
/** Called when the user saves changes in the Edit popup. */
export async function updateHoldingAction(
  id: number,
  input: HoldingUpdate,
): Promise<ActionResult> {
  try {
    await updateHolding(id, input);
    revalidatePath("/portfolios");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Something went wrong while updating the holding.";

    return { success: false, error: message };
  }
}
```

Save. Open `createHoldingAction` in the same file — notice how similar your new function is.

---

## Step 5 — Create the Edit popup

Almost the same as "Add holding", but fields start **filled in** with the row's current values.

### Create: `src/components/holdings/edit-holding-dialog.tsx`

Paste everything below:

```tsx
"use client";

/**
 * Popup form for editing an existing holding.
 */

import { useEffect, useState, useTransition } from "react";

import { updateHoldingAction } from "@/app/portfolios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Holding, HoldingUpdate } from "@/types/holding";

type EditHoldingDialogProps = {
  holding: Holding;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditHoldingDialog({
  holding,
  open,
  onOpenChange,
}: EditHoldingDialogProps) {
  const [form, setForm] = useState<HoldingUpdate>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    setForm({
      ticker: holding.ticker,
      quantity_added: holding.quantity_added,
      purchase_price: holding.purchase_price,
      purchase_date: holding.purchase_date ?? "",
    });
    setError(null);
  }, [open, holding]);

  function updateField(field: keyof HoldingUpdate, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const payload: HoldingUpdate = {
      ...form,
      ticker: form.ticker?.trim().toUpperCase(),
    };

    startTransition(async () => {
      const result = await updateHoldingAction(holding.id, payload);

      if (result.success) {
        onOpenChange(false);
        return;
      }

      setError(result.error ?? "Failed to update holding.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {holding.ticker}</DialogTitle>
          <DialogDescription>
            Change the details below, then click Save changes.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-holding-form"
          onSubmit={handleSubmit}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="edit-ticker">Ticker</Label>
            <Input
              id="edit-ticker"
              placeholder="AAPL"
              value={form.ticker ?? ""}
              onChange={(event) => updateField("ticker", event.target.value)}
              required
              maxLength={20}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-quantity_added">Quantity</Label>
            <Input
              id="edit-quantity_added"
              type="number"
              step="any"
              min="0.000001"
              placeholder="10"
              value={form.quantity_added ?? ""}
              onChange={(event) =>
                updateField("quantity_added", event.target.value)
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-purchase_price">Purchase price (USD)</Label>
            <Input
              id="edit-purchase_price"
              type="number"
              step="any"
              min="0"
              placeholder="150.00"
              value={form.purchase_price ?? ""}
              onChange={(event) =>
                updateField("purchase_price", event.target.value)
              }
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-purchase_date">Purchase date</Label>
            <Input
              id="edit-purchase_date"
              type="date"
              value={form.purchase_date ?? ""}
              onChange={(event) =>
                updateField("purchase_date", event.target.value)
              }
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="edit-holding-form" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Step 6 — Add Edit to the ⋯ menu

Go back to `holding-row-actions.tsx` from Step 2 and **add** Edit. Replace the entire file with this version:

```tsx
"use client";

/**
 * The ⋯ menu on each table row: Edit and Delete.
 */

import { useState } from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteHoldingDialog } from "@/components/holdings/delete-holding-dialog";
import { EditHoldingDialog } from "@/components/holdings/edit-holding-dialog";
import type { Holding } from "@/types/holding";

type HoldingRowActionsProps = {
  holding: Holding;
};

export function HoldingRowActions({ holding }: HoldingRowActionsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${holding.ticker}`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditHoldingDialog
        holding={holding}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteHoldingDialog
        holding={holding}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
```

Save → refresh `/portfolios`.

**What changed from Step 2:** Added Edit menu item, `EditHoldingDialog`, and `editOpen` state. Delete is unchanged.

---

## Step 7 — Final test

- [ ] **⋯ → Edit** opens a popup with the row's current values filled in
- [ ] Change quantity (e.g. `10` → `15`) → **Save changes** → table updates to `15`
- [ ] **⋯ → Delete** still works
- [ ] Run `npm run lint` and `npm run build` in the `frontend` folder — both pass

### If something breaks

| What you see              | What to try                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| ⋯ menu missing            | Part 1 — check Step 1 ran and Step 3 swapped the table cell              |
| Delete broken             | Ask the team — `delete-holding-dialog.tsx` should already be in the repo |
| Edit opens but Save fails | Part 2 — re-check Steps 4a and 4b                                        |
| Edit popup fields empty   | Ask someone to help check `holding.purchase_date` format                 |
| Red errors in terminal    | Read the last line for file + line number                                |

---

## Optional cleanup (after everything works)

Delete `src/components/holdings/delete-holding-button.tsx` — nothing uses it anymore.

---

## Optional extras

1. **"Saved!" message** — ask the team about shadcn `sonner` toast

---

## END

Now push your changes

```bash
git add .
git commit -m "feat: add edit holding dialog and row actions menu"
git push
```
