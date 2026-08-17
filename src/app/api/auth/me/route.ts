import { NextResponse } from "next/server";
import { getSession, ensureAdminExists } from "@/lib/auth";

export async function GET() {
  try {
    await ensureAdminExists();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ user: null });
  }
}
