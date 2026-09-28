import { NextResponse } from "next/server";
import type { z } from "zod";

import type { ApiErrorBody, ApiSuccess } from "@/lib/types";

export function jsonData<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ data }, init);
}

export function jsonError(status: number, message: string, fieldErrors?: Record<string, string[]>) {
  return NextResponse.json<ApiErrorBody>({ error: { message, ...(fieldErrors && { fieldErrors }) } }, { status });
}

export function jsonValidationError(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "body";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return jsonError(422, "Invalid expense data", fieldErrors);
}

/** Logs the real error server-side and returns a generic 500 to the client. */
export function jsonUnexpectedError(error: unknown, context: string) {
  console.error(`[api] ${context}`, error);
  return jsonError(500, "Something went wrong on our side. Please try again.");
}
