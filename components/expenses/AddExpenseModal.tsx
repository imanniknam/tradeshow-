"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, ArrowRightIcon, PlusIcon } from "lucide-react";
import { createContext, useContext, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Controller, useForm, useWatch, type Control } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/users/UserAvatar";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { useCreateExpense, useUsers } from "@/lib/api/queries";
import { formatCents, parseAmountToCents } from "@/lib/money";
import type { UserDto } from "@/lib/types";
import {
  DESCRIPTION_MAX_LENGTH,
  emptyExpenseForm,
  expenseFormSchema,
  toCreateExpenseInput,
  type ExpenseFormValues,
} from "@/lib/validations/expense";

/** Maps API payload field names back to form field names. */
const API_TO_FORM_FIELD: Record<string, keyof ExpenseFormValues> = {
  paidById: "paidById",
  expenseForId: "expenseForId",
  amountCents: "amount",
  description: "description",
};

const AddExpenseContext = createContext<{ openAddExpense: () => void } | null>(null);

/** Owns the single Add Expense dialog so any button on the page can open it. */
export function AddExpenseProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ openAddExpense: () => setOpen(true) }), []);

  return (
    <AddExpenseContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 sm:max-w-lg">
          {/* Content unmounts when closed, so every opening starts with a fresh form. */}
          <AddExpenseForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </AddExpenseContext.Provider>
  );
}

export function AddExpenseButton({ children, ...props }: ComponentProps<typeof Button>) {
  const context = useContext(AddExpenseContext);
  if (!context) {
    throw new Error("AddExpenseButton must be used inside AddExpenseProvider");
  }

  return (
    <Button onClick={context.openAddExpense} {...props}>
      {children ?? (
        <>
          <PlusIcon />
          Add Expense
        </>
      )}
    </Button>
  );
}

function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const users = useUsers();
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: emptyExpenseForm,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const expense = await createExpense.mutateAsync(toCreateExpenseInput(values));
      toast.success("Expense added", {
        description: `${expense.expenseFor.name} now owes ${expense.paidBy.name} ${formatCents(expense.amountCents)} more.`,
      });
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [apiField, messages] of Object.entries(error.fieldErrors)) {
          const formField = API_TO_FORM_FIELD[apiField];
          if (formField && messages[0]) {
            form.setError(formField, { message: messages[0] });
          }
        }
      }
      // The general error message is rendered from `createExpense.error`.
    }
  });

  const isSubmitting = createExpense.isPending;

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader className="border-b px-6 pt-6 pb-4">
        <DialogTitle className="text-lg font-semibold">Add Expense</DialogTitle>
        <DialogDescription>Record a payment one person made on behalf of another.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 px-6 py-5">
        {users.error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Couldn&apos;t load people</AlertTitle>
            <AlertDescription>
              {getErrorMessage(users.error)}{" "}
              <button type="button" className="underline underline-offset-2" onClick={() => users.refetch()}>
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {createExpense.error && (
          <Alert variant="destructive" role="alert">
            <AlertCircleIcon />
            <AlertTitle>Couldn&apos;t save the expense</AlertTitle>
            <AlertDescription>{getErrorMessage(createExpense.error)}</AlertDescription>
          </Alert>
        )}

        <FieldGroup className="gap-5">
          <UserSelectField
            control={form.control}
            name="paidById"
            label="Paid by"
            placeholder="Who paid?"
            users={users.data}
            isLoading={users.isPending}
          />
          <UserSelectField
            control={form.control}
            name="expenseForId"
            label="Expense for"
            placeholder="Who was it for?"
            users={users.data}
            isLoading={users.isPending}
          />

          <Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="amount">Amount (USD)</FieldLabel>
                <div className="relative">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-medium text-muted-foreground"
                  >
                    $
                  </span>
                  <Input
                    {...field}
                    id="amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0.00"
                    className="h-11 pl-8 text-base tabular-nums sm:text-sm"
                    aria-invalid={fieldState.invalid}
                  />
                </div>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  {...field}
                  id="description"
                  rows={3}
                  placeholder="e.g. Dinner, taxi, groceries…"
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  className="min-h-20 resize-none text-base sm:text-sm"
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>

        <DebtPreview control={form.control} users={users.data} />
      </div>

      <DialogFooter className="mx-0 mb-0 px-6 py-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" size="lg">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" size="lg" disabled={isSubmitting || !users.data}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Saving…" : "Add Expense"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface UserSelectFieldProps {
  control: Control<ExpenseFormValues>;
  name: "paidById" | "expenseForId";
  label: string;
  placeholder: string;
  users: UserDto[] | undefined;
  isLoading: boolean;
}

function UserSelectField({ control, name, label, placeholder, users, isLoading }: UserSelectFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      // Re-validate the other user field so the "different people" rule updates immediately.
      rules={{ deps: name === "paidById" ? "expenseForId" : "paidById" }}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select name={field.name} value={field.value} onValueChange={field.onChange} disabled={!users}>
            <SelectTrigger
              id={name}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              className="w-full data-[size=default]:h-11"
            >
              <SelectValue placeholder={isLoading ? "Loading people…" : placeholder} />
            </SelectTrigger>
            <SelectContent position="popper">
              {users?.map((user) => (
                <SelectItem key={user.id} value={String(user.id)} className="py-2">
                  <UserAvatar user={user} size="xs" />
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

/** Spells out the direction of the debt once the form is filled in. */
function DebtPreview({ control, users }: { control: Control<ExpenseFormValues>; users: UserDto[] | undefined }) {
  const [paidById, expenseForId, amount] = useWatch({ control, name: ["paidById", "expenseForId", "amount"] });

  const payer = users?.find((user) => String(user.id) === paidById);
  const recipient = users?.find((user) => String(user.id) === expenseForId);
  const amountCents = parseAmountToCents(amount);

  const preview =
    payer && recipient && payer.id !== recipient.id && amountCents ? { payer, recipient, amountCents } : null;

  return (
    <div aria-live="polite">
      {preview && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-accent px-3.5 py-3">
          <div aria-hidden className="flex items-center gap-1">
            <UserAvatar user={preview.recipient} size="xs" />
            <ArrowRightIcon className="size-3.5 text-primary" />
            <UserAvatar user={preview.payer} size="xs" />
          </div>
          <p className="text-accent-foreground">
            <span className="font-semibold">{preview.recipient.name}</span> will owe{" "}
            <span className="font-semibold">{preview.payer.name}</span>{" "}
            <span className="font-semibold tabular-nums">{formatCents(preview.amountCents)}</span>.
          </p>
        </div>
      )}
    </div>
  );
}
