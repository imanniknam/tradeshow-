"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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

export function AddExpenseModal() {
  const [open, setOpen] = useState(false);
  const users = useUsers();
  const createExpense = useCreateExpense();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: emptyExpenseForm,
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(emptyExpenseForm);
      createExpense.reset();
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const expense = await createExpense.mutateAsync(toCreateExpenseInput(values));
      toast.success("Expense added", {
        description: `${expense.expenseFor.name} now owes ${expense.paidBy.name} ${formatCents(expense.amountCents)} more.`,
      });
      handleOpenChange(false);
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg">
          <PlusIcon />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>Record a payment one person made on behalf of another.</DialogDescription>
          </DialogHeader>

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

          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                placeholder="Paid for whom?"
                users={users.data}
                isLoading={users.isPending}
              />
            </div>

            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="amount">Amount (USD)</FieldLabel>
                  <div className="relative">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted-foreground"
                    >
                      $
                    </span>
                    <Input
                      {...field}
                      id="amount"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      className="pl-6 tabular-nums"
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
                  <Input
                    {...field}
                    id="description"
                    autoComplete="off"
                    placeholder="e.g. Dinner at the harbour"
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <DebtPreview control={form.control} users={users.data} />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || !users.data}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? "Saving…" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
              className="w-full"
            >
              <SelectValue placeholder={isLoading ? "Loading people…" : placeholder} />
            </SelectTrigger>
            <SelectContent>
              {users?.map((user) => (
                <SelectItem key={user.id} value={String(user.id)}>
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
        <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">
          <span className="font-medium text-foreground">{preview.recipient.name}</span> will owe{" "}
          <span className="font-medium text-foreground">{preview.payer.name}</span>{" "}
          <span className="font-medium text-foreground tabular-nums">{formatCents(preview.amountCents)}</span>.
        </p>
      )}
    </div>
  );
}
