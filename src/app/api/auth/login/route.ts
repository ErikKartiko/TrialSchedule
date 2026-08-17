import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession, ensureAdminExists } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    await ensureAdminExists();
    const { username, password } = await req.json();

    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const user = result[0];
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const token = await createSession(user.id);
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      user: { username: user.username, fullName: user.fullName },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
