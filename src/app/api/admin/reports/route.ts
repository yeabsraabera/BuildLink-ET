import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { Report } from "@/models/Report";

export async function GET() {
  await connection();
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    await connectDB();
    const reports = await Report.find().sort({ createdAt: -1 }).limit(50).populate("reporter", "name town").lean();
    await writeAdminLog({ adminId: auth.user.id, action: "view reports" });
    return ok(
      reports.map((report) => {
        const reporter = report.reporter as { name?: string; town?: string } | null;
        return {
          id: String(report._id),
          targetType: report.targetType,
          targetId: String(report.targetId),
          reason: report.reason,
          status: report.status,
          createdAt: report.createdAt ? new Date(report.createdAt).toISOString() : undefined,
          reporter: { name: reporter?.name ?? "Unknown", town: reporter?.town ?? "" },
        };
      }),
      "Reports",
    );
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
