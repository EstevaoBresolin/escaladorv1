export interface DateNormalizationResult {
  value: string | null;
  error?: string;
}

export function formatBrazilianDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatISODateToBrazilian(value?: string | null): string {
  if (!value) {
    return "";
  }

  const normalizedValue = value.split("T")[0];
  const [year, month, day] = normalizedValue.split("-");

  if (!year || !month || !day) {
    return "";
  }

  return formatBrazilianDateInput(`${day}${month}${year}`);
}

export function normalizeBrazilianDate(value: string): DateNormalizationResult {
  const digits = value.replace(/\D/g, "");

  if (digits.length !== 8) {
    return {
      value: null,
      error: "Use a data no formato DD/MM/AAAA",
    };
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return {
      value: null,
      error: "Data inválida. Use o formato DD/MM/AAAA",
    };
  }

  return {
    value: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}