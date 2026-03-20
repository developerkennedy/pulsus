import { db } from '@/lib/db';
import { patients, NewPatient, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get all patients
 */
export async function getAllPatients(userId: number) {
  return db
    .select({
      id: patients.id,
      userId: patients.userId,
      cpf: patients.cpf,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      phone: patients.phone,
      emergencyContact: patients.emergencyContact,
      emergencyPhone: patients.emergencyPhone,
      user: {
        name: users.name,
        email: users.email,
      },
      isActive: patients.isActive,
      createdAt: patients.createdAt,
      updatedAt: patients.updatedAt,
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .where(and(eq(patients.userId, userId), eq(patients.isActive, true)));
}

/**
 * Get patient by ID
 */
export async function getPatientById(id: number, userId: number) {
  return db
    .select({
      id: patients.id,
      userId: patients.userId,
      cpf: patients.cpf,
      dateOfBirth: patients.dateOfBirth,
      gender: patients.gender,
      phone: patients.phone,

      emergencyContact: patients.emergencyContact,
      emergencyPhone: patients.emergencyPhone,

      user: {
        name: users.name,
        email: users.email,
      },
      isActive: patients.isActive,
      createdAt: patients.createdAt,
      updatedAt: patients.updatedAt,
    })
    .from(patients)
    .innerJoin(users, eq(patients.userId, users.id))
    .where(
      and(
        eq(patients.id, id),
        eq(patients.userId, userId),
        eq(patients.isActive, true),
      ),
    )
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Get patient by CPF
 */
export async function getPatientByCpf(cpf: string, userId: number) {
  return db
    .select()
    .from(patients)
    .where(and(eq(patients.cpf, cpf), eq(patients.userId, userId)))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Create or update patient (upsert)
 * Updates if patient with same CPF exists, otherwise creates new
 */
export async function upsertPatient(data: NewPatient) {
  return db
    .insert(patients)
    .values(data)
    .onConflictDoUpdate({
      target: patients.cpf,
      set: {
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * Delete patient (soft delete)
 */
export async function deletePatient(id: number) {
  return db
    .update(patients)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(patients.id, id))
    .returning();
}
