// validator.ts

export interface ValidationResult {
    valid: boolean;
    errors: string[];
  }
  
  export function validateUserInput({
    firstName,
    lastName,
    email,
    password,
    role,
    validatePassword = false, // default false for POST, true for PUT
  }: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    role?: string;
    validatePassword?: boolean;
  }): ValidationResult {
    const errors: string[] = [];
  
    // Allowed roles
    const allowedRoles = ['Developer', 'Admin', 'CEO', 'Finance', 'Team Lead'];
  
    // First Name
    if (!firstName || firstName.trim() === '') {
      errors.push('First name is required.');
    } else if (!/^[a-z][a-zA-Z]*$/.test(firstName)) {
      errors.push('First name must be camelCase (start lowercase, no spaces).');
    }
  
    // Last Name
    if (!lastName || lastName.trim() === '') {
      errors.push('Last name is required.');
    } else if (!/^[a-z][a-zA-Z]*$/.test(lastName)) {
      errors.push('Last name must be camelCase (start lowercase, no spaces).');
    }
  
    // Email
    if (!email || email.trim() === '') {
      errors.push('Email is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email must be a valid format.');
    }
  
    // Role
    if (!role || role.trim() === '') {
      errors.push('Role is required.');
    } else if (!allowedRoles.includes(role)) {
      errors.push(`Role must be one of: ${allowedRoles.join(', ')}`);
    }
  
    // Password (only when we explicitly validate, e.g. in PUT)
    if (validatePassword) {
      if (!password || password.trim() === '') {
        errors.push('Password is required.');
      } else {
        if (password.length < 8) {
          errors.push('Password must be at least 8 characters long.');
        }
        if (!/[A-Z]/.test(password)) {
          errors.push('Password must contain at least one uppercase letter.');
        }
        if (!/[0-9]/.test(password)) {
          errors.push('Password must contain at least one number.');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          errors.push('Password must contain at least one special character.');
        }
        const lowerPass = password.toLowerCase();
        if (firstName && lowerPass.includes(firstName.toLowerCase())) {
          errors.push('Password should not contain your first name.');
        }
        if (lastName && lowerPass.includes(lastName.toLowerCase())) {
          errors.push('Password should not contain your last name.');
        }
      }
    }
  
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  