export function getAuthErrorMessage(error: unknown) {
  if (error && typeof error === 'object') {
    const authError = error as {
      body?: { message?: unknown };
      message?: unknown;
    };

    const message = authError.body?.message ?? authError.message;

    if (typeof message !== 'string') {
      try {
        return JSON.stringify(message);
      } catch {
        return 'Não foi possível concluir a autenticação. Tente novamente.';
      }
    }

    if (message?.toLowerCase().includes('user already exists')) {
      return 'Já existe uma conta cadastrada com este e-mail.';
    }

    if (
      message?.toLowerCase().includes('invalid email or password') ||
      message?.toLowerCase().includes('invalid password')
    ) {
      return 'E-mail ou senha inválidos.';
    }

    if (message) {
      return message;
    }
  }

  return 'Não foi possível concluir a autenticação. Tente novamente.';
}
