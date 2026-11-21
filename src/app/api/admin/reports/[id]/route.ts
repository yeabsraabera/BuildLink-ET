import { unstable_rethrow } from "next/navigation";
import mongoose from "mongoose";

import { fail, ok, readJson, serverError, zodFail } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { requireAdmin, writeAdminLog } from "@/lib/guards";
import { adminReportSchema } from "@/lib/validators";
import { Report } from "@/models/Report";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const auth = await requireAdmin();
    if (!auth.user) return auth.error;
    const parsed = adminReportSchema.safeParse(await readJson(request));
    if (!parsed.success) return zodFail(parsed.error);

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return fail("Report not found", 404);
    await connectDB();
    const report = await Report.findById(id);
    if (!report) return fail("Report not found", 404);
    report.status = "resolved";
    await report.save();
    await writeAdminLog({
      adminId: auth.user.id,
      action: "resolve report",
      targetType: "report",
      targetId: String(report._id),
    });
    return ok({ id: String(report._id), status: report.status }, "Report resolved");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
