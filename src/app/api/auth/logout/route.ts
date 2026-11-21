import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
    return ok(null, "Signed out");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
