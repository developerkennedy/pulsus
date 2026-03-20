import { db } from '@/lib/db';
import { users, NewUser } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  return db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  return db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Get all active users
 */
export async function getAllActiveUsers() {
  return db.select().from(users).where(eq(users.isActive, true));
}

/**
 * Create or update user (upsert)
 * Updates if user with same email exists, otherwise creates new
 */
export async function upsertUser(data: NewUser) {
  return db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.email,
      set: {
        password: data.password,
        name: data.name,
        role: data.role,
        clinicName: data.clinicName,
        phone: data.phone,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * Deactivate user (soft delete)
 */
export async function deactivateUser(id: number) {
  return db
    .update(users)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
}

/**
 * Activate user
 */
export async function activateUser(id: number) {
  return db
    .update(users)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
}
