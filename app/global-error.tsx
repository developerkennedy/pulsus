'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Algo deu errado</h1>
          <p>Ocorreu um erro inesperado. Nossa equipe já foi notificada.</p>
          <button
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
