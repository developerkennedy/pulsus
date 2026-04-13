'use server';

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { clinics, users } from '@/lib/db/schema';
import { getAuthErrorMessage } from '@/features/auth/lib/get-auth-error-message';
import {
  signUpSchema,
  type SignUpActionState,
  type SignUpValues,
} from '@/features/auth/schemas/sign-up-schema';

export async function signUpAction(
  values: SignUpValues,
): Promise<SignUpActionState> {
  const parsedValues = signUpSchema.safeParse(values);

  if (!parsedValues.success) {
    const fieldErrors = parsedValues.error.flatten().fieldErrors;

    return {
      success: false,
      fieldErrors: {
        clinicName: fieldErrors.clinicName?.[0],
        adminName: fieldErrors.adminName?.[0],
        adminEmail: fieldErrors.adminEmail?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      },
    };
  }

  const requestHeaders = new Headers(await headers());
  let createdClinicId: string | null = null;
  let createdUserId: string | null = null;

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, parsedValues.data.adminEmail),
      columns: {
        id: true,
      },
    });

    if (existingUser) {
      return {
        success: false,
        fieldErrors: {
          adminEmail: 'Já existe uma conta cadastrada com este e-mail.',
        },
      };
    }

    const [clinic] = await db
      .insert(clinics)
      .values({
        name: parsedValues.data.clinicName,
        email: parsedValues.data.adminEmail,
      })
      .returning({
        id: clinics.id,
      });

    createdClinicId = clinic.id;

    const signUpResult = await auth.api.signUpEmail({
      body: {
        name: parsedValues.data.adminName,
        email: parsedValues.data.adminEmail,
        password: parsedValues.data.password,
      },
      headers: requestHeaders,
    });

    createdUserId = String(signUpResult.user.id);

    await db
      .update(users)
      .set({
        clinicId: createdClinicId,
        role: 'admin',
      })
      .where(eq(users.id, createdUserId));

    return {
      success: true,
    };
  } catch (error) {
    await auth.api
      .signOut({
        headers: requestHeaders,
      })
      .catch(() => null);

    if (createdUserId) {
      await db.delete(users).where(eq(users.id, createdUserId)).catch(() => null);
    }

    if (createdClinicId) {
      await db
        .delete(clinics)
        .where(eq(clinics.id, createdClinicId))
        .catch(() => null);
    }

    return {
      success: false,
      message: getAuthErrorMessage(error),
    };
  }
}
