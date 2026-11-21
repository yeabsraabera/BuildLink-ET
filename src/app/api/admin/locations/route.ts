import { unstable_rethrow } from "next/navigation";

import { created, fail, isDuplicateKey, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { adminLocationSchema } from "@/lib/validators";
import { Location } from "@/models/Location";

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    const parsed = adminLocationSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    await connectDB();
    const location = await Location.create({ ...parsed.data, active: true });
    await writeAdminLog({
      adminId: auth.user.id,
      action: "add location",
      targetType: "location",
      targetId: String(location._id),
      note: location.name,
    });
    return created(
      {
        id: String(location._id),
        name: location.name,
        region: location.region,
        zone: location.zone,
      },
      "Location added",
    );
  } catch (error) {
    unstable_rethrow(error);
    if (isDuplicateKey(error)) return fail("That town already exists", 409);
    return serverError(error);
  }
}
