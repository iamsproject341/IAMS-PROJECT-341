// Shared form validation helpers used across all forms in IAMS.
// Each function returns an empty string when valid, or an error message when invalid.

// Names: letters, spaces, hyphens, apostrophes, periods only. NO numbers/symbols.
export const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,59}$/;
export function validateName(value, label = 'Name') {
  if (!value || !value.trim()) return `${label} is required`;
  const v = value.trim();
  if (v.length < 2) return `${label} must be at least 2 characters`;
  if (v.length > 60) return `${label} must be 60 characters or fewer`;
  if (!NAME_REGEX.test(v)) return `${label} can only contain letters, spaces, hyphens and apostrophes`;
  return '';
}

// Email
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address (e.g. you@example.com)';
  return '';
}

// Botswana-style phone: optional +267 then 7-12 digits, allow spaces/dashes
export const PHONE_REGEX = /^\+?[\d\s-]{7,16}$/;
export function validatePhone(value, required = false) {
  if (!value || !value.trim()) return required ? 'Phone number is required' : '';
  if (!PHONE_REGEX.test(value.trim())) return 'Enter a valid phone number (digits only, e.g. +267 71234567)';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 'Phone number must be 7–15 digits';
  return '';
}

// 9-digit student ID — format: YYYY + 5 digits (e.g. 202103579).
// Year must be within a sensible range (1990 .. current year).
// Rejects all-zeros, all-same-digit suffixes (e.g. 00000, 11111), and
// suspicious sequential suffixes like 12345 / 54321.
export function validateStudentId(value) {
  if (!value || !value.trim()) return 'Student ID is required';
  const v = value.trim();

  if (!/^\d{9}$/.test(v)) return 'Student ID must be exactly 9 digits';

  // Block obvious junk like 000000000 or 123456789
  if (/^(\d)\1{8}$/.test(v)) return 'Student ID cannot be all the same digit';

  const year = parseInt(v.slice(0, 4), 10);
  const suffix = v.slice(4); // 5 digits

  const currentYear = new Date().getFullYear();
  if (year < 1990 || year > currentYear) {
    return `Student ID must start with a valid year between 1990 and ${currentYear}`;
  }

  // Suffix cannot be all zeros or all the same digit
  if (/^(\d)\1{4}$/.test(suffix)) {
    return 'Student ID suffix cannot be all zeros or all the same digit';
  }

  // Block trivially sequential suffixes (12345, 54321, 01234, etc.)
  const ascending = '0123456789';
  const descending = '9876543210';
  if (ascending.includes(suffix) || descending.includes(suffix)) {
    return 'Student ID suffix looks invalid — use your real ID';
  }

  return '';
}

// Password
export function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Password must contain both letters and numbers';
  return '';
}

// Generic required text (free-form, e.g. address, description)
export function validateRequired(value, label = 'This field') {
  if (!value || !value.trim()) return `${label} is required`;
  return '';
}

// Min length text (for descriptions, week summaries, etc.)
export function validateMinLength(value, min, label = 'This field') {
  const err = validateRequired(value, label);
  if (err) return err;
  if (value.trim().length < min) return `${label} must be at least ${min} characters`;
  return '';
}

// Numeric / positive integer (e.g. capacity, hours)
export function validatePositiveNumber(value, label = 'Value', { required = true, min = 1, max = 1000000 } = {}) {
  if (value === '' || value === null || value === undefined) {
    return required ? `${label} is required` : '';
  }
  const n = Number(value);
  if (Number.isNaN(n)) return `${label} must be a number`;
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n < min) return `${label} must be at least ${min}`;
  if (n > max) return `${label} must be ${max} or less`;
  return '';
}

// Strip non-letters from a name input as the user types (kills numbers immediately).
export function sanitizeNameInput(value) {
  return value.replace(/[^A-Za-z\s.'-]/g, '').slice(0, 60);
}

// Strip non-digits for student ID, phone, etc.
export function sanitizeDigits(value, maxLen = 15) {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

// Allow digits + spaces + + - for phone display
export function sanitizePhoneInput(value) {
  return value.replace(/[^\d+\s-]/g, '').slice(0, 16);
}
