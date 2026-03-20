import { db } from '@/lib/db';
import {
  doctors,
  NewDoctor,
  Doctor,
  specialities,
  users,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get all doctors with their specialities
 */
export async function getAllDoctors(): Promise<
  (Doctor & { speciality?: { name: string } })[]
> {
  return db
    .select({
      id: doctors.id,
      userId: doctors.userId,
      specialityId: doctors.specialityId,
      license: doctors.license,
      phone: doctors.phone,
      bio: doctors.bio,
      availableDaysOfWeek: doctors.availableDaysOfWeek,
      startTime: doctors.startTime,
      endTime: doctors.endTime,
      consultationFee: doctors.consultationFee,
      isActive: doctors.isActive,
      createdAt: doctors.createdAt,
      updatedAt: doctors.updatedAt,
      speciality: {
        name: specialities.name,
      },
    })
    .from(doctors)
    .innerJoin(specialities, eq(doctors.specialityId, specialities.id))
    .where(eq(doctors.isActive, true));
}

/**
 * Get doctor by ID with full details
 */
export async function getDoctorById(id: number) {
  return db
    .select({
      id: doctors.id,
      userId: doctors.userId,
      license: doctors.license,
      phone: doctors.phone,
      bio: doctors.bio,
      availableDaysOfWeek: doctors.availableDaysOfWeek,
      startTime: doctors.startTime,
      endTime: doctors.endTime,
      consultationFee: doctors.consultationFee,
      isActive: doctors.isActive,
      createdAt: doctors.createdAt,
      updatedAt: doctors.updatedAt,
      speciality: {
        id: specialities.id,
        name: specialities.name,
      },
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(doctors)
    .innerJoin(specialities, eq(doctors.specialityId, specialities.id))
    .innerJoin(users, eq(doctors.userId, users.id))
    .where(and(eq(doctors.id, id), eq(doctors.isActive, true)))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Get doctors by clinic (user)
 */
export async function getDoctorsByClinic(userId: number) {
  return db
    .select({
      id: doctors.id,
      userId: doctors.userId,
      license: doctors.license,
      phone: doctors.phone,
      bio: doctors.bio,
      availableDaysOfWeek: doctors.availableDaysOfWeek,
      startTime: doctors.startTime,
      endTime: doctors.endTime,
      consultationFee: doctors.consultationFee,
      isActive: doctors.isActive,
      createdAt: doctors.createdAt,
      updatedAt: doctors.updatedAt,
      speciality: {
        name: specialities.name,
      },
    })
    .from(doctors)
    .innerJoin(specialities, eq(doctors.specialityId, specialities.id))
    .where(and(eq(doctors.userId, userId), eq(doctors.isActive, true)));
}

/**
 * Create or update doctor (upsert)
 * Updates if doctor with same license exists, otherwise creates new
 */
export async function upsertDoctor(data: NewDoctor) {
  return db
    .insert(doctors)
    .values(data)
    .onConflictDoUpdate({
      target: doctors.license,
      set: {
        phone: data.phone,
        bio: data.bio,
        availableDaysOfWeek: data.availableDaysOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        consultationFee: data.consultationFee,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })
    .returning();
}

/**
 * Delete doctor (soft delete)
 */
export async function deleteDoctor(id: number) {
  return db
    .update(doctors)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(doctors.id, id))
    .returning();
}


