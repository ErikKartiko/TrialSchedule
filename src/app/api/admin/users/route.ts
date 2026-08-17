import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengakses" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // Filter by status
    const role = searchParams.get("role"); // Filter by role

    const filters = [];

    if (status) {
      filters.push(eq(users.status, status as any));
    }

    if (role) {
      filters.push(eq(users.role, role as any));
    }

    const allUsers = await db
      .select()
      .from(users)
      .where(filters.length > 0 ? and(...filters) : undefined);

    return NextResponse.json({
      success: true,
      count: allUsers.length,
      users: allUsers.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        department: u.department,
        nip: u.nip,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengakses" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, status, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID harus diisi" },
        { status: 400 }
      );
    }

    // Cek user exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Update user
    const updated = await db
      .update(users)
      .set({
        ...(status && { status: status as any }),
        ...(role && { role: role as any }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "User berhasil diperbarui",
      user: updated[0],
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengakses" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID harus diisi" },
        { status: 400 }
      );
    }

    // Prevent deleting admin account
    const userToDelete = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userToDelete.length === 0) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    if (userToDelete[0].role === "admin") {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun admin" },
        { status: 400 }
      );
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
