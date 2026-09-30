"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircleIcon, ArrowLeftRightIcon, ArrowRightIcon, PlusIcon } from "lucide-react";
import { createContext, useContext, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { Controller, useForm, useWatch, type Control, type UseFormReturn } from "react-hook-form";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/users/UserAvatar";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { queryKeys, useBalances, useCreateExpense, useUsers } from "@/lib/api/queries";
import { describeNet, netOwedCents, previewExpenseEffect } from "@/lib/balance/pairBalance";
import { formatCents, formatCentsForInput, parseAmountToCents } from "@/lib/money";
import type { BalanceDto, ExpenseDto, UserDto } from "@/lib/types";
import { cn } from "@/lib/utils";
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
        <DialogContent className="gap-0 p-0 sm:max-w-md">
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

/** "Bob now owes Alice $130.00", computed from the refreshed balances. */
function describeOutcome(expense: ExpenseDto, balances: BalanceDto[] | undefined): string {
  const { paidBy, expenseFor } = expense;
  if (!balances) {
    return `${expenseFor.name} owes ${paidBy.name} ${formatCents(expense.amountCents)} for this.`;
  }
  const net = describeNet(expenseFor, paidBy, netOwedCents(balances, expenseFor.id, paidBy.id));
  return net
    ? `${net.from.name} now owes ${net.to.name} ${formatCents(net.amountCents)} in total.`
    : `${paidBy.name} and ${expenseFor.name} are now settled up.`;
}

function AddExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient();
  const users = useUsers();
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: emptyExpenseForm,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const expense = await createExpense.mutateAsync(toCreateExpenseInput(values));
      // The mutation resolves only after the balances have been refetched.
      const balances = queryClient.getQueryData<BalanceDto[]>(queryKeys.balances);
      toast.success("Expense added", { description: describeOutcome(expense, balances) });
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
      <DialogHeader className="gap-1 px-5 pt-5 pb-4 sm:px-6">
        <DialogTitle className="text-base font-semibold">New expense</DialogTitle>
        <DialogDescription>One person paid for another. The other person now owes them that amount.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 px-5 pb-5 sm:px-6">
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

        <PeopleFields form={form} users={users.data} isLoading={users.isPending} />

        <Controller
          control={form.control}
          name="amount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <FieldLabel htmlFor="amount">Amount (USD)</FieldLabel>
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
                >
                  $
                </span>
                <Input
                  {...field}
                  onBlur={() => {
                    // Tidy the amount ("12.5" -> "12.50") once the user leaves the field.
                    const cents = parseAmountToCents(field.value);
                    if (cents) form.setValue("amount", formatCentsForInput(cents), { shouldValidate: true });
                    field.onBlur();
                  }}
                  id="amount"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="h-10 pl-7 text-base font-medium tabular-nums"
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
            <Field data-invalid={fieldState.invalid} className="gap-1.5">
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <CharacterCount length={field.value.length} />
              </div>
              <Input
                {...field}
                id="description"
                autoComplete="off"
                placeholder="Dinner, taxi, groceries…"
                maxLength={DESCRIPTION_MAX_LENGTH}
                className="h-10 text-base sm:text-sm"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <BalancePreview control={form.control} users={users.data} />
      </div>

      <DialogFooter className="mx-0 mb-0 px-5 py-3.5 sm:px-6">
        <DialogClose asChild>
          <Button type="button" variant="outline" size="lg">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" size="lg" disabled={isSubmitting || !users.data} className="min-w-28">
          {isSubmitting && <Spinner />}
          {isSubmitting ? "Saving…" : "Save expense"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Shown only once the description gets close to the limit. */
function CharacterCount({ length }: { length: number }) {
  if (length < DESCRIPTION_MAX_LENGTH * 0.75) return null;
  return (
    <span
      className={cn(
        "text-xs tabular-nums",
        length >= DESCRIPTION_MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {length}/{DESCRIPTION_MAX_LENGTH}
    </span>
  );
}

interface PeopleFieldsProps {
  form: UseFormReturn<ExpenseFormValues>;
  users: UserDto[] | undefined;
  isLoading: boolean;
}

/** "Paid by" and "Expense for", side by side with a button to swap them. */
function PeopleFields({ form, users, isLoading }: PeopleFieldsProps) {
  function swap() {
    const { paidById, expenseForId } = form.getValues();
    const shouldValidate = form.formState.isSubmitted;
    form.setValue("paidById", expenseForId, { shouldValidate });
    form.setValue("expenseForId", paidById, { shouldValidate });
  }

  return (
    <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-2">
      <UserSelectField
        control={form.control}
        name="paidById"
        label="Paid by"
        placeholder="Who paid?"
        users={users}
        isLoading={isLoading}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={swap}
        aria-label="Swap payer and recipient"
        title="Swap payer and recipient"
        className="text-muted-foreground max-sm:hidden sm:mt-[1.625rem]"
      >
        <ArrowLeftRightIcon />
      </Button>
      <UserSelectField
        control={form.control}
        name="expenseForId"
        label="Expense for"
        placeholder="Who was it for?"
        users={users}
        isLoading={isLoading}
      />
    </div>
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
        <Field data-invalid={fieldState.invalid} className="gap-1.5">
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Select name={field.name} value={field.value} onValueChange={field.onChange} disabled={!users}>
            <SelectTrigger
              id={name}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              className="w-full data-[size=default]:h-10"
            >
              <SelectValue placeholder={isLoading ? "Loading…" : placeholder} />
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

function NetLine({ net, muted }: { net: BalanceDto | null; muted?: boolean }) {
  if (!net) {
    return <span className={cn(muted ? "text-muted-foreground" : "font-medium")}>Settled up</span>;
  }
  return (
    <span className={cn(muted && "text-muted-foreground")}>
      <span className={cn(!muted && "font-medium")}>{net.from.name}</span> owes{" "}
      <span className={cn(!muted && "font-medium")}>{net.to.name}</span>{" "}
      <span className={cn("tabular-nums", !muted && "font-semibold")}>{formatCents(net.amountCents)}</span>
    </span>
  );
}

/**
 * Shows how this expense changes the balance between the two people. Because
 * balances are netted, a new expense can also reduce, settle or flip a debt.
 */
function BalancePreview({ control, users }: { control: Control<ExpenseFormValues>; users: UserDto[] | undefined }) {
  const balances = useBalances();
  const [paidById, expenseForId, amount] = useWatch({ control, name: ["paidById", "expenseForId", "amount"] });

  const payer = users?.find((user) => String(user.id) === paidById);
  const recipient = users?.find((user) => String(user.id) === expenseForId);
  const amountCents = parseAmountToCents(amount);
  const ready = payer && recipient && payer.id !== recipient.id && amountCents;

  return (
    <div aria-live="polite" data-testid="balance-preview" className="min-h-[4.25rem] rounded-lg bg-muted/70 px-3.5 py-3">
      {!ready ? (
        <p className="py-2.5 text-center text-xs text-muted-foreground">
          Choose both people and an amount to see how their balance changes.
        </p>
      ) : balances.data ? (
        <ImpactLines {...previewExpenseEffect(balances.data, payer, recipient, amountCents)} />
      ) : (
        <p className="py-1.5">
          <NetLine net={{ from: recipient, to: payer, amountCents }} /> for this expense.
        </p>
      )}
    </div>
  );
}

function ImpactLines({ before, after }: { before: BalanceDto | null; after: BalanceDto | null }) {
  return (
    <dl className="grid grid-cols-[3rem_1fr] items-center gap-x-2 gap-y-1">
      <dt className="text-xs text-muted-foreground">Now</dt>
      <dd>
        <NetLine net={before} muted />
      </dd>
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        After <ArrowRightIcon aria-hidden className="size-3" />
      </dt>
      <dd>
        <NetLine net={after} />
      </dd>
    </dl>
  );
}
