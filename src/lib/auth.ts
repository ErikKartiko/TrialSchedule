import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await db.insert(sessions).values({ userId, token, expiresAt });
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const result = await db
    .select({
      userId: sessions.userId,
      username: users.username,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) return null;
  const session = result[0];
  return session;
}

export async function ensureAdminExists() {
  const adminUsername = "admin";
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, adminUsername))
    .limit(1);

  const hash = await hashPassword("admin123");

  if (existing.length === 0) {
    await db
      .insert(users)
      .values({
        username: adminUsername,
        passwordHash: hash,
        fullName: "Administrator",
        email: "admin@trialschedule.local",
        phone: "08123456789",
        department: "System",
        nip: "00000001",
        role: "admin",
        status: "active",
      })
      .onConflictDoNothing();
    return;
  }

  await db
    .update(users)
    .set({
      passwordHash: hash,
      fullName: existing[0].fullName || "Administrator",
      email: existing[0].email || "admin@trialschedule.local",
      phone: existing[0].phone || "08123456789",
      department: existing[0].department || "System",
      nip: existing[0].nip || "00000001",
      role: "admin",
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(users.username, adminUsername));
}
