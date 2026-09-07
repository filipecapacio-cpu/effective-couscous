/** Validação de CPF/CNPJ — exigido pela Asaas pra emitir qualquer cobrança de verdade. */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCpf(cpf: string): boolean {
  // Sequências como "111.111.111-11" têm 11 dígitos iguais e passam no
  // cálculo do dígito verificador por coincidência - precisa rejeitar à parte.
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digit = (base: string, factor: number) => {
    let sum = 0;
    for (const d of base) sum += Number(d) * factor--;
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = digit(cpf.slice(0, 9), 10);
  const d2 = digit(cpf.slice(0, 9) + d1, 11);
  return cpf === cpf.slice(0, 9) + d1 + d2;
}

function isValidCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digit = (base: string, weights: number[]) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = digit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digit(cnpj.slice(0, 12) + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return cnpj === cnpj.slice(0, 12) + d1 + d2;
}

/** Aceita o valor com ou sem máscara - CPF (11 dígitos) ou CNPJ (14 dígitos), com dígito verificador conferido. */
export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 11 ? isValidCpf(digits) : digits.length === 14 ? isValidCnpj(digits) : false;
}
