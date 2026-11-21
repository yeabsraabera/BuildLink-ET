import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { AdminLog } from "@/models/AdminLog";

export async function GET() {
  await connection();
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    await connectDB();
    const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(40).populate("admin", "name town").lean();
    await writeAdminLog({ adminId: auth.user.id, action: "view audit log" });
    return ok(
      logs.map((entry) => {
        const admin = entry.admin as { name?: string; town?: string } | null;
        return {
          id: String(entry._id),
          action: entry.action,
          targetType: entry.targetType,
          targetId: entry.targetId ? String(entry.targetId) : undefined,
          note: entry.note,
          createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : undefined,
          admin: { name: admin?.name ?? "Unknown", town: admin?.town ?? "" },
        };
      }),
      "Audit log",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
