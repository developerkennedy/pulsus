import { db } from '@/lib/db';
import { specialities, NewSpeciality } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get all specialities
 */
export async function getAllSpecialities() {
  return db.select().from(specialities);
}

/**
 * Get speciality by ID
 */
export async function getSpecialityById(id: number) {
  return db
    .select()
    .from(specialities)
    .where(eq(specialities.id, id))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Get speciality by name
 */
export async function getSpecialityByName(name: string) {
  return db
    .select()
    .from(specialities)
    .where(eq(specialities.name, name))
    .limit(1)
    .then((result) => result[0] || null);
}

/**
 * Create or update speciality (upsert)
 * Updates if speciality with same name exists, otherwise creates new
 */
export async function upsertSpeciality(data: NewSpeciality) {
  return db
    .insert(specialities)
    .values(data)
    .onConflictDoUpdate({
      target: specialities.name,
      set: {
        description: data.description,
        icon: data.icon,
      },
    })
    .returning();
}

/**
 * Delete speciality
 */
export async function deleteSpeciality(id: number) {
  return db.delete(specialities).where(eq(specialities.id, id)).returning();
}
