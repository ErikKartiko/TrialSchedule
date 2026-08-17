import { pgTable, text, timestamp, boolean, integer, uuid, pgEnum } from "drizzle-orm/pg-core";

export const recurrenceEnum = pgEnum("recurrence_type", [
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);

export const statusEnum = pgEnum("event_status", [
  "scheduled",
  "completed",
  "cancelled",
]);

export const categoryEnum = pgEnum("category_type", [
  "teaching",
  "course",
  "meeting",
  "mentoring",
  "research",
  "other",
]);

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "lecturer", // dosen
]);

export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "pending", // menunggu approval dari admin
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  department: text("department"), // Departemen/Fakultas
  nip: text("nip"), // Nomor Induk Pegawai
  role: userRoleEnum("role").default("lecturer").notNull(),
  status: userStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  category: categoryEnum("category").default("other").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  recurrence: recurrenceEnum("recurrence").default("none").notNull(),
  recurrenceEnd: timestamp("recurrence_end"),
  status: statusEnum("status").default("scheduled").notNull(),
  reminderMinutes: integer("reminder_minutes").default(15),
  color: text("color").default("#3B82F6"),
  sourceClassScheduleId: uuid("source_class_schedule_id"), // link ke class schedule jika di-sync
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dayOfWeekEnum = pgEnum("day_of_week", [
  "senin",
  "selasa",
  "rabu",
  "kamis",
  "jumat",
  "sabtu",
  "minggu",
]);

export const classSchedules = pgTable("class_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  day: dayOfWeekEnum("day").notNull(),
  startTime: text("start_time").notNull(), // format "HH:mm"
  endTime: text("end_time").notNull(), // format "HH:mm"
  courseCode: text("course_code"),
  courseName: text("course_name").notNull(),
  className: text("class_name"), // Kelas: A, B, C, dst
  room: text("room"),
  teachers: text("teachers").array().notNull().default([]),
  semester: text("semester"), // Mis: Ganjil 2024/2025
  notes: text("notes"),
  syncedEventId: uuid("synced_event_id"),
  autoSync: boolean("auto_sync").default(true).notNull(), // auto-sync ke calendar
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
