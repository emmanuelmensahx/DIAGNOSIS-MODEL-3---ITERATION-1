// Validation utility functions and rules

export const VALIDATION_RULES = {
  REQUIRED: 'required',
  EMAIL: 'email',
  PHONE: 'phone',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
  NUMERIC: 'numeric',
  DATE: 'date',
  AGE: 'age',
  CUSTOM: 'custom',
};

export const ERROR_MESSAGES = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must not exceed ${max} characters`,
  pattern: 'Invalid format',
  numeric: 'Please enter a valid number',
  date: 'Please enter a valid date',
  age: 'Please enter a valid age (0-150)',
  custom: 'Invalid value',
};

// Validation functions
export const validators = {
  required: (value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  phone: (value) => {
    // Support various phone formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
    return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
  },

  minLength: (min) => (value) => {
    return value && value.length >= min;
  },

  maxLength: (max) => (value) => {
    return !value || value.length <= max;
  },

  pattern: (regex) => (value) => {
    return !value || regex.test(value);
  },

  numeric: (value) => {
    return !value || (!isNaN(value) && !isNaN(parseFloat(value)));
  },

  date: (value) => {
    if (!value) return true;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },

  age: (value) => {
    if (!value) return true;
    const age = parseInt(value);
    return !isNaN(age) && age >= 0 && age <= 150;
  },

  custom: (validatorFn) => (value) => {
    return validatorFn(value);
  },
};

// Validation rule builder
export class ValidationRule {
  constructor(field) {
    this.field = field;
    this.rules = [];
  }

  required(message) {
    this.rules.push({
      type: VALIDATION_RULES.REQUIRED,
      validator: validators.required,
      message: message || ERROR_MESSAGES.required,
    });
    return this;
  }

  email(message) {
    this.rules.push({
      type: VALIDATION_RULES.EMAIL,
      validator: validators.email,
      message: message || ERROR_MESSAGES.email,
    });
    return this;
  }

  phone(message) {
    this.rules.push({
      type: VALIDATION_RULES.PHONE,
      validator: validators.phone,
      message: message || ERROR_MESSAGES.phone,
    });
    return this;
  }

  minLength(min, message) {
    this.rules.push({
      type: VALIDATION_RULES.MIN_LENGTH,
      validator: validators.minLength(min),
      message: message || ERROR_MESSAGES.minLength(min),
    });
    return this;
  }

  maxLength(max, message) {
    this.rules.push({
      type: VALIDATION_RULES.MAX_LENGTH,
      validator: validators.maxLength(max),
      message: message || ERROR_MESSAGES.maxLength(max),
    });
    return this;
  }

  pattern(regex, message) {
    this.rules.push({
      type: VALIDATION_RULES.PATTERN,
      validator: validators.pattern(regex),
      message: message || ERROR_MESSAGES.pattern,
    });
    return this;
  }

  numeric(message) {
    this.rules.push({
      type: VALIDATION_RULES.NUMERIC,
      validator: validators.numeric,
      message: message || ERROR_MESSAGES.numeric,
    });
    return this;
  }

  date(message) {
    this.rules.push({
      type: VALIDATION_RULES.DATE,
      validator: validators.date,
      message: message || ERROR_MESSAGES.date,
    });
    return this;
  }

  age(message) {
    this.rules.push({
      type: VALIDATION_RULES.AGE,
      validator: validators.age,
      message: message || ERROR_MESSAGES.age,
    });
    return this;
  }

  custom(validatorFn, message) {
    this.rules.push({
      type: VALIDATION_RULES.CUSTOM,
      validator: validators.custom(validatorFn),
      message: message || ERROR_MESSAGES.custom,
    });
    return this;
  }

  build() {
    return {
      field: this.field,
      rules: this.rules,
    };
  }
}

// Create validation rule
export const rule = (field) => new ValidationRule(field);

// Form validator class
export class FormValidator {
  constructor(validationRules = []) {
    this.validationRules = validationRules;
    this.errors = {};
  }

  addRule(validationRule) {
    this.validationRules.push(validationRule);
    return this;
  }

  validate(data) {
    this.errors = {};
    let isValid = true;

    for (const ruleSet of this.validationRules) {
      const { field, rules } = ruleSet;
      const value = data[field];

      for (const rule of rules) {
        if (!rule.validator(value)) {
          this.errors[field] = rule.message;
          isValid = false;
          break; // Stop at first error for this field
        }
      }
    }

    return {
      isValid,
      errors: this.errors,
    };
  }

  validateField(field, value) {
    const ruleSet = this.validationRules.find(r => r.field === field);
    if (!ruleSet) return { isValid: true, error: null };

    for (const rule of ruleSet.rules) {
      if (!rule.validator(value)) {
        return {
          isValid: false,
          error: rule.message,
        };
      }
    }

    return { isValid: true, error: null };
  }

  getFieldError(field) {
    return this.errors[field] || null;
  }

  hasErrors() {
    return Object.keys(this.errors).length > 0;
  }

  clearErrors() {
    this.errors = {};
  }

  clearFieldError(field) {
    delete this.errors[field];
  }
}

// Predefined validation schemas for common forms
export const validationSchemas = {
  patient: [
    rule('firstName').required().minLength(2).maxLength(50).build(),
    rule('lastName').required().minLength(2).maxLength(50).build(),
    rule('email').email().build(),
    rule('phone').required().phone().build(),
    rule('age').required().age().build(),
    rule('gender').required().build(),
  ],

  diagnosis: [
    rule('patientId').required().build(),
    rule('symptoms').required().build(),
    rule('chiefComplaint').required().minLength(10).maxLength(500).build(),
    rule('duration').required().build(),
  ],

  login: [
    rule('email').required().email().build(),
    rule('password').required().minLength(6).build(),
  ],

  registration: [
    rule('firstName').required().minLength(2).maxLength(50).build(),
    rule('lastName').required().minLength(2).maxLength(50).build(),
    rule('email').required().email().build(),
    rule('password').required().minLength(8).build(),
    rule('confirmPassword').required().custom((value, data) => {
      return value === data.password;
    }, 'Passwords do not match').build(),
    rule('licenseNumber').required().minLength(5).build(),
    rule('specialization').required().build(),
  ],

  treatmentPlan: [
    rule('diagnosis').required().build(),
    rule('medications').required().build(),
    rule('dosage').required().build(),
    rule('duration').required().build(),
    rule('instructions').required().minLength(20).build(),
  ],
};

// Utility functions
export const createValidator = (schema) => {
  return new FormValidator(schema);
};

export const validateForm = (data, schema) => {
  const validator = new FormValidator(schema);
  return validator.validate(data);
};

export const validateField = (field, value, schema) => {
  const validator = new FormValidator(schema);
  return validator.validateField(field, value);
};

// Real-time validation hook helper
export const useFormValidation = (initialData = {}, schema = []) => {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const validator = React.useMemo(() => new FormValidator(schema), [schema]);

  const validateField = React.useCallback((field, value) => {
    const result = validator.validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field]: result.error,
    }));
    return result;
  }, [validator]);

  const validateForm = React.useCallback(() => {
    const result = validator.validate(data);
    setErrors(result.errors);
    return result;
  }, [validator, data]);

  const setValue = React.useCallback((field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Validate if field has been touched
    if (touched[field]) {
      validateField(field, value);
    }
  }, [touched, validateField]);

  const setFieldTouched = React.useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, data[field]);
  }, [data, validateField]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const reset = React.useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    data,
    errors,
    touched,
    setValue,
    setTouched: setFieldTouched,
    validateField,
    validateForm,
    clearErrors,
    reset,
    isValid: Object.keys(errors).length === 0,
    hasErrors: Object.keys(errors).length > 0,
  };
};

export default {
  ValidationRule,
  FormValidator,
  validators,
  validationSchemas,
  createValidator,
  validateForm,
  validateField,
  useFormValidation,
  rule,
};