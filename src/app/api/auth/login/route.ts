import { unstable_rethrow } from "next/navigation";

import { fail, readJson, serverError, ok, zodFail } from "@/lib/api";
import { setAuthCookie, signAuthToken, toSessionUser, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { loginSchema } from "@/lib/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (body === undefined) return fail("Request body must be JSON", 400);

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");
    const passwordHash = user?.get("passwordHash");
    const matches =
      typeof passwordHash === "string" &&
      (await verifyPassword(parsed.data.password, passwordHash));

    if (!user || !matches) return fail("Email or password is incorrect", 401);
    if (user.accountStatus === "suspended") return fail("This account is suspended", 403);

    await setAuthCookie(await signAuthToken(user._id.toString()));
    return ok(toSessionUser(user), "Signed in");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
