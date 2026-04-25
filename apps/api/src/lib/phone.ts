export function normalizeBangladeshPhone(input: string): string {
  const compact = input.replace(/[\s().-]/g, "");
  if (/^01[3-9]\d{8}$/.test(compact)) {
    return `+88${compact}`;
  }
  if (/^8801[3-9]\d{8}$/.test(compact)) {
    return `+${compact}`;
  }
  if (/^\+8801[3-9]\d{8}$/.test(compact)) {
    return compact;
  }
  throw new Error("Invalid Bangladesh mobile number");
}

export function isBangladeshPhone(input: string): boolean {
  try {
    normalizeBangladeshPhone(input);
    return true;
  } catch {
    return false;
  }
}
