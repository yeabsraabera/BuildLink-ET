import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { created, fail, ok, readJson, serverError } from "@/lib/api";
import { requireUser } from "@/lib/guards";
import { ensureTown, listTowns } from "@/lib/locations";

export async function GET() {
  await connection();
  try {
    return ok(await listTowns(), "Locations");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}

export async function POST(request: Request) {
  await connection();
  try {
    const auth = await requireUser();
    if (!auth.user) return auth.error;
    const body = await readJson(request);
    const name = body && typeof body === "object" && "name" in body ? String(body.name ?? "") : "";
    const town = await ensureTown(name);
    if (!town) return fail("Enter a town name", 400);
    return created(town, "Town saved");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
