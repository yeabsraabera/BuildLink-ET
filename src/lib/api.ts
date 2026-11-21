import { NextResponse } from "next/server";

export type FieldError = {
  path: string;
  message: string;
};

export function ok(data: unknown, message: string, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function created(data: unknown, message: string) {
  return ok(data, message, 201);
}

export function fail(message: string, status: number, errors?: FieldError[]) {
  const body: { success: false; message: string; errors?: FieldError[] } = {
    success: false,
    message,
  };
  if (errors && errors.length > 0) body.errors = errors;
  return NextResponse.json(body, { status });
}

export function zodFail(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return fail(
    "Check the form and try again.",
    400,
    error.issues.map((issue) => ({
      path: issue.path.map(String).join("."),
      message: issue.message,
    })),
  );
}

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export function serverError(error: unknown) {
  console.error(error);
  return fail("Something went wrong. Try again.", 500);
}
