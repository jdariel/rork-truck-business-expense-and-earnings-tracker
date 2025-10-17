export const ValidationRules = {
  required: (value: string | number | undefined | null): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
  },

  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  minLength: (value: string, min: number): boolean => {
    return value.trim().length >= min;
  },

  maxLength: (value: string, max: number): boolean => {
    return value.trim().length <= max;
  },

  number: (value: string): boolean => {
    return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
  },

  positiveNumber: (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num > 0;
  },

  nonNegativeNumber: (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0;
  },

  integer: (value: string): boolean => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num.toString() === value.trim();
  },

  year: (value: string): boolean => {
    const year = parseInt(value, 10);
    const currentYear = new Date().getFullYear();
    return !isNaN(year) && year >= 1900 && year <= currentYear + 1;
  },

  date: (value: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  },

  plateNumber: (value: string): boolean => {
    return value.trim().length >= 2 && value.trim().length <= 10;
  },

  vin: (value: string): boolean => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(value.trim().toUpperCase());
  },

  phone: (value: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(value.trim());
  },

  zipCode: (value: string): boolean => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(value.trim());
  },
};

export const sanitize = {
  string: (value: string): string => {
    return value.trim().replace(/[<>]/g, '');
  },

  number: (value: string): number | null => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  },

  integer: (value: string): number | null => {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  },

  alphanumeric: (value: string): string => {
    return value.replace(/[^a-zA-Z0-9]/g, '');
  },

  uppercase: (value: string): string => {
    return value.trim().toUpperCase();
  },

  lowercase: (value: string): string => {
    return value.trim().toLowerCase();
  },
};

export interface ValidationError {
  field: string;
  message: string;
}

export class FormValidator {
  private errors: ValidationError[] = [];

  validate(field: string, value: any, rules: {
    required?: boolean;
    email?: boolean;
    minLength?: number;
    maxLength?: number;
    positiveNumber?: boolean;
    nonNegativeNumber?: boolean;
    year?: boolean;
    date?: boolean;
    custom?: (value: any) => boolean;
    customMessage?: string;
  }): this {
    if (rules.required && !ValidationRules.required(value)) {
      this.errors.push({ field, message: `${field} is required` });
      return this;
    }

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return this;
    }

    if (rules.email && !ValidationRules.email(value)) {
      this.errors.push({ field, message: `${field} must be a valid email` });
    }

    if (rules.minLength && !ValidationRules.minLength(value, rules.minLength)) {
      this.errors.push({ field, message: `${field} must be at least ${rules.minLength} characters` });
    }

    if (rules.maxLength && !ValidationRules.maxLength(value, rules.maxLength)) {
      this.errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters` });
    }

    if (rules.positiveNumber && !ValidationRules.positiveNumber(value)) {
      this.errors.push({ field, message: `${field} must be a positive number` });
    }

    if (rules.nonNegativeNumber && !ValidationRules.nonNegativeNumber(value)) {
      this.errors.push({ field, message: `${field} must be a non-negative number` });
    }

    if (rules.year && !ValidationRules.year(value)) {
      this.errors.push({ field, message: `${field} must be a valid year` });
    }

    if (rules.date && !ValidationRules.date(value)) {
      this.errors.push({ field, message: `${field} must be a valid date (YYYY-MM-DD)` });
    }

    if (rules.custom && !rules.custom(value)) {
      this.errors.push({ 
        field, 
        message: rules.customMessage || `${field} is invalid` 
      });
    }

    return this;
  }

  isValid(): boolean {
    return this.errors.length === 0;
  }

  getErrors(): ValidationError[] {
    return this.errors;
  }

  getFirstError(): string | null {
    return this.errors.length > 0 ? this.errors[0].message : null;
  }

  clear(): void {
    this.errors = [];
  }
}
