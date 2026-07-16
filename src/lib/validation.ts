/**
 * Form validation utilities
 */

export interface ValidationErrors {
  [key: string]: string;
}

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};

export const validateFullName = (name: string): string | null => {
  if (!name) return 'Full name is required';
  if (name.trim().length < 2) {
    return 'Full name must be at least 2 characters';
  }
  if (name.trim().length > 100) {
    return 'Full name must be less than 100 characters';
  }
  return null;
};

export const validatePasswordConfirm = (password: string, confirm: string): string | null => {
  if (password !== confirm) {
    return 'Passwords do not match';
  }
  return null;
};

export const validateBirthDate = (date: string): string | null => {
  if (!date) return null; // Optional field
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();

  if (age < 0 || age > 150) {
    return 'Please enter a valid birth date';
  }
  if (birthDate > today) {
    return 'Birth date cannot be in the future';
  }
  return null;
};

export const validateProfileForm = (data: {
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  bio?: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (data.fullName !== undefined) {
    const nameError = validateFullName(data.fullName);
    if (nameError) errors.fullName = nameError;
  }

  if (data.email !== undefined) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.email = emailError;
  }

  if (data.dateOfBirth !== undefined) {
    const dateError = validateBirthDate(data.dateOfBirth);
    if (dateError) errors.dateOfBirth = dateError;
  }

  if (data.bio !== undefined && data.bio && data.bio.length > 500) {
    errors.bio = 'Bio must be less than 500 characters';
  }

  return errors;
};

export const validateSignupForm = (data: {
  fullName: string;
  email: string;
  password: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  const nameError = validateFullName(data.fullName);
  if (nameError) errors.fullName = nameError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  return errors;
};

export const validateLoginForm = (data: {
  email: string;
  password: string;
}): ValidationErrors => {
  const errors: ValidationErrors = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return errors;
};
