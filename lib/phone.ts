export interface PhoneNormalizationResult {
  value: string | null;
  error?: string;
}

export function normalizeBrazilianPhone(
  input: string,
): PhoneNormalizationResult {
  if (/[\p{L}]/u.test(input)) {
    return { value: null, error: "Use apenas números no telefone" };
  }

  const cleaned = input.replace(/\D/g, "");

  if (!cleaned) {
    return { value: null, error: "Número de telefone é obrigatório" };
  }

  let national = cleaned;

  if (cleaned.startsWith("55") && cleaned.length > 11) {
    national = cleaned.slice(2);
  }

  if (national.length !== 10 && national.length !== 11) {
    return {
      value: null,
      error: "Informe um número válido com DDD (10 ou 11 dígitos)",
    };
  }

  const ddd = parseInt(national.slice(0, 2), 10);
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { value: null, error: "DDD inválido" };
  }

  return { value: `55${national}` };
}
