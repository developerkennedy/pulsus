'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getAuthErrorMessage } from '@/features/auth/lib/get-auth-error-message';
import {
  signInSchema,
  type SignInActionState,
  type SignInValues,
} from '@/features/auth/schemas/sign-in-schema';

export async function signInAction(
  values: SignInValues,
): Promise<SignInActionState> {
  const parsedValues = signInSchema.safeParse(values);

  if (!parsedValues.success) {
    const fieldErrors = parsedValues.error.flatten().fieldErrors;

    return {
      success: false,
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsedValues.data.email,
        password: parsedValues.data.password,
        rememberMe: true,
      },
      headers: new Headers(await headers()),
    });

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: getAuthErrorMessage(error),
    };
  }
}
