export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUsername(value) {
  return /^[a-z0-9_]{3,20}$/.test(value);
}

export function passwordStrength(value) {
  if (value.length < 8) return "weak";
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^a-zA-Z0-9]/.test(value);
  const score = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3 && value.length >= 10) return "strong";
  if (score >= 2) return "medium";
  return "weak";
}

export function normalizeUsername(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "");
}
