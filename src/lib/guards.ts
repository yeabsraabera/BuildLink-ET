import { fail } from "@/lib/api";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { AdminLog } from "@/models/AdminLog";
import { connectDB } from "@/lib/db";

export async function requireUser(): Promise<
  { user: SessionUser; error: null } | { user: null; error: Response }
> {
  const user = await getSessionUser();
  if (!user) return { user: null, error: fail("Sign in required", 401) };
  if (user.accountStatus === "suspended") {
    return { user: null, error: fail("This account is suspended", 403) };
  }
  return { user, error: null };
}

export async function requireAdmin(): Promise<
  { user: SessionUser; error: null } | { user: null; error: Response }
> {
  const result = await requireUser();
  if (!result.user) return result;
  if (!result.user.isAdmin) return { user: null, error: fail("Admin only", 403) };
  return result;
}

export async function writeAdminLog(input: {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  note?: string;
}) {
  await connectDB();
  await AdminLog.create({
    admin: input.adminId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    note: input.note,
  });
}
