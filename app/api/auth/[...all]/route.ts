import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const AUTH_RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };
const SIGN_UP_RATE_LIMIT = { windowMs: 60_000, maxRequests: 5 };

const rateLimitedPaths = new Set([
  '/sign-in/email',
  '/sign-up/email',
  '/forget-password',
  '/reset-password',
]);

function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}

function shouldRateLimit(pathname: string): boolean {
  return rateLimitedPaths.has(pathname);
}

function getConfig(pathname: string) {
  return pathname === '/sign-up/email' ? SIGN_UP_RATE_LIMIT : AUTH_RATE_LIMIT;
}

async function handleRequest(request: Request) {
  const url = new URL(request.url);
  const authPath = url.pathname.replace('/api/auth', '');

  if (request.method === 'POST' && shouldRateLimit(authPath)) {
    const ip = getClientIp(request);
    const key = `auth:${ip}:${authPath}`;
    const config = getConfig(authPath);
    const result = rateLimit(key, config);

    if (!result.allowed) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
          },
        },
      );
    }
  }

  return handler[request.method === 'GET' ? 'GET' : 'POST'](request);
}

const handler = toNextJsHandler(auth);

export const GET = handleRequest;
export const POST = handleRequest;
