/**
 * Formata um número de telefone brasileiro para o padrão (XX) XXXXX-XXXX.
 * Aceita dígitos com ou sem máscara — extrai apenas os números antes de formatar.
 * Retorna a string original se não tiver 10 ou 11 dígitos.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';

  const digits = value.replace(/\D/g, '');

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value;
}
