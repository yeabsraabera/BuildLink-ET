import { connection } from "next/server";
import { unstable_rethrow } from "next/navigation";

import { ok, serverError } from "@/lib/api";
import { listTowns } from "@/lib/locations";

export async function GET() {
  await connection();
  try {
    return ok(await listTowns(), "Locations");
  } catch (error) {
    unstable_rethrow(error);
    return serverError(error);
  }
}
