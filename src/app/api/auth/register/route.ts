import { unstable_rethrow } from "next/navigation";

import { created, fail, isDuplicateKey, readJson, serverError, zodFail } from "@/lib/api";
import { hashPassword, setAuthCookie, signAuthToken, toSessionUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureTown } from "@/lib/locations";
import { registerSchema } from "@/lib/validators";
import { User } from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    if (body === undefined) return fail("Request body must be JSON", 400);

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const town = await ensureTown(parsed.data.town);
    if (!town) return fail("Choose a town, or type one under Other", 400);

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) return fail("An account with this email already exists", 409);

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      town: parsed.data.town,
      passwordHash: await hashPassword(parsed.data.password),
      isAdmin: false,
      accountStatus: "active",
    });

    await setAuthCookie(await signAuthToken(user._id.toString()));
    return created(toSessionUser(user), "Account created");
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateKey(error)) return fail("An account with this email already exists", 409);
    return serverError(error);
  }
}
