import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET não definida — necessário para criptografia.');
  }
  return createHmac('sha256', secret).update('cpf-encryption-key').digest();
}

function getHmacKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET não definida — necessário para hash.');
  }
  return createHmac('sha256', secret).update('cpf-hmac-key').digest();
}

/**
 * Criptografa um valor sensível (ex: CPF).
 * Retorna string no formato: `iv:authTag:ciphertext` (hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descriptografa um valor criptografado com `encrypt()`.
 */
export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('Formato de dado criptografado inválido.');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/**
 * Gera hash determinístico (HMAC-SHA256) para busca por unique constraint.
 * O hash é sempre o mesmo para o mesmo input + secret.
 */
export function hmacHash(value: string): string {
  return createHmac('sha256', getHmacKey()).update(value).digest('hex');
}
