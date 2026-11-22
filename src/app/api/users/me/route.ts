import { unstable_rethrow } from "next/navigation";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import { ensureTown } from "@/lib/locations";
import { publicProfile, ratingFor } from "@/lib/profile";
import { profileSchema } from "@/lib/validators";
import { User } from "@/models/User";

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const parsed = profileSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const user = await User.findById(auth.user.id);
    if (!user) return fail("Profile not found", 404);

    if (parsed.data.town) {
      const town = await ensureTown(parsed.data.town);
      if (!town) return fail("Choose a town, or type one under Other", 400);
      user.town = town.name;
    }
    if (parsed.data.name) user.name = parsed.data.name;
    if (parsed.data.role) user.role = parsed.data.role;
    if (parsed.data.headline !== undefined) user.headline = parsed.data.headline;
    if (parsed.data.bio !== undefined) user.bio = parsed.data.bio;
    if (parsed.data.skills) user.skills = parsed.data.skills;
    if (parsed.data.experience) user.set("experience", parsed.data.experience);
    if (parsed.data.avatarUrl !== undefined) user.avatarUrl = parsed.data.avatarUrl || undefined;
    if (parsed.data.paymentMethods !== undefined) {
      user.set("paymentMethods", parsed.data.paymentMethods);
      user.markModified("paymentMethods");
    }
    await user.save();

    const stats = await ratingFor(auth.user.id);
    return ok(publicProfile(user.toObject(), stats), "Profile updated");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
