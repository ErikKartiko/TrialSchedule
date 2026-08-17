import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSession, ensureAdminExists } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await ensureAdminExists();
    const body = await req.json();

    const { username, email, password, passwordConfirm, fullName, phone, department, nip } = body;

    // Validasi
    if (!username || !email || !password || !passwordConfirm || !fullName) {
      return NextResponse.json(
        { error: "Username, email, password, dan nama harus diisi" },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Password tidak cocok" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Cek username & email sudah terdaftar
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Username sudah terdaftar" },
        { status: 400 }
      );
    }

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password & create user
    const hash = await hashPassword(password);
    const created = await db
      .insert(users)
      .values({
        username,
        passwordHash: hash,
        fullName,
        email,
        phone: phone || null,
        department: department || null,
        nip: nip || null,
        role: "lecturer",
        status: "pending", // menunggu approval admin
      })
      .returning();

    const user = created[0];

    // Create session
    const token = await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Akun Anda sedang menunggu persetujuan admin.",
      user: {
        userId: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
