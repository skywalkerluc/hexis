import { NextResponse } from "next/server";
import { runDailyDecayUseCase } from "@/modules/decay/application/run-daily-decay.use-case";

export async function POST(request: Request): Promise<Response> {
  const providedSecret = request.headers.get("x-hexis-job-secret");
  const expectedSecret = process.env.HEXIS_JOB_SECRET;

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDailyDecayUseCase({ now: new Date() });
  return NextResponse.json(result);
}
