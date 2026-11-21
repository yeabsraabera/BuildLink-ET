import { unstable_rethrow } from "next/navigation";

import { fail, ok, serverError } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return fail("Sign in required", 401);
    return ok(user, "Signed in");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
