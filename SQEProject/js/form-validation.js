// Form Validation and Enhancement
// Provides real-time validation, password strength indicator, and comprehensive error handling

class FormValidator {
    constructor() {
        this.validators = {
            email: {
                pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Please enter a valid email address (e.g., user@example.com)'
            },
            password: {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
            },
            phone: {
                pattern: /^[0-9]{10,15}$/,
                message: 'Phone number must be 10-15 digits without spaces or dashes'
            },
            name: {
                pattern: /^[A-Za-z ]{2,50}$/,
                message: 'Name must be 2-50 characters, letters only'
            }
        };
    }

    // Initialize validation for a form
    initializeForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Add real-time validation to all inputs
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Validate on blur (when user leaves the field)
            input.addEventListener('blur', () => this.validateField(input));
            
            // For password, also validate on input for strength indicator
            if (input.type === 'password' && input.id === 'password') {
                input.addEventListener('input', () => {
                    this.updatePasswordStrength(input);
                    this.validateField(input);
                });
            }

            // For confirm password, validate on input
            if (input.id === 'confirmPassword') {
                input.addEventListener('input', () => this.validatePasswordMatch());
            }

            // Clear error on focus
            input.addEventListener('focus', () => this.clearFieldError(input));
        });

        // Validate entire form on submit
        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }

    // Validate a single field
    validateField(input) {
        const errorDiv = input.parentElement.querySelector('.form-error');
        if (!errorDiv) return true;

        // Clear previous error
        this.clearFieldError(input);

        // Check if field is required and empty
        if (input.hasAttribute('required') && !input.value.trim()) {
            this.showFieldError(input, `${input.dataset.label || 'This field'} is required`);
            return false;
        }

        // Check pattern validation
        const pattern = input.getAttribute('pattern');
        if (pattern && input.value) {
            const regex = new RegExp(pattern);
            if (!regex.test(input.value)) {
                const customMessage = this.getCustomMessage(input);
                this.showFieldError(input, customMessage);
                return false;
            }
        }

        // Check minlength
        const minLength = input.getAttribute('minlength');
        if (minLength && input.value.length < parseInt(minLength)) {
            this.showFieldError(input, `Minimum ${minLength} characters required`);
            return false;
        }

        // Check maxlength
        const maxLength = input.getAttribute('maxlength');
        if (maxLength && input.value.length > parseInt(maxLength)) {
            this.showFieldError(input, `Maximum ${maxLength} characters allowed`);
            return false;
        }

        // Special validation for email type
        if (input.type === 'email' && input.value) {
            if (!this.validators.email.pattern.test(input.value)) {
                this.showFieldError(input, this.validators.email.message);
                return false;
            }
        }

        // Mark as valid
        input.classList.add('is-valid');
        input.classList.remove('is-invalid');
        return true;
    }

    // Validate entire form
    validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.type !== 'submit' && !this.validateField(input)) {
                isValid = false;
            }
        });

        // Special validation for password confirmation
        if (form.querySelector('#confirmPassword')) {
            if (!this.validatePasswordMatch()) {
                isValid = false;
            }
        }

        return isValid;
    }

    // Validate password confirmation matches
    validatePasswordMatch() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        
        if (!password || !confirmPassword) return true;

        this.clearFieldError(confirmPassword);

        if (confirmPassword.value && password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Passwords do not match');
            return false;
        }

        confirmPassword.classList.add('is-valid');
        confirmPassword.classList.remove('is-invalid');
        return true;
    }

    // Show error message for a field
    showFieldError(input, message) {
        const errorDiv = input.parentElement.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
    }

    // Clear error message for a field
    clearFieldError(input) {
        const errorDiv = input.parentElement.querySelector('.form-error');
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
        input.classList.remove('is-invalid');
        input.classList.remove('is-valid');
    }

    // Get custom error message based on input type
    getCustomMessage(input) {
        const type = input.type;
        const name = input.name;
        const id = input.id;

        if (type === 'email' || name === 'email') {
            return this.validators.email.message;
        }
        if (type === 'password' || name === 'password') {
            return this.validators.password.message;
        }
        if (type === 'tel' || name === 'phone') {
            return this.validators.phone.message;
        }
        if (name === 'firstName' || name === 'lastName') {
            return this.validators.name.message;
        }

        return `Please enter a valid ${input.dataset.label || 'value'}`;
    }

    // Update password strength indicator
    updatePasswordStrength(passwordInput) {
        const strengthDiv = document.getElementById('passwordStrength');
        if (!strengthDiv) return;

        const password = passwordInput.value;
        
        if (!password) {
            strengthDiv.innerHTML = '';
            return;
        }

        let strength = 0;
        let strengthText = '';
        let strengthColor = '';

        // Check password criteria
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasDigit = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        // Calculate strength
        if (hasLower) strength++;
        if (hasUpper) strength++;
        if (hasDigit) strength++;
        if (hasSpecial) strength++;
        if (isLongEnough) strength++;

        // Determine strength level
        if (strength < 3) {
            strengthText = 'Weak';
            strengthColor = '#dc3545';
        } else if (strength < 4) {
            strengthText = 'Medium';
            strengthColor = '#ffc107';
        } else {
            strengthText = 'Strong';
            strengthColor = '#28a745';
        }

        // Calculate percentage
        const percentage = (strength / 5) * 100;

        // Update strength indicator
        strengthDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="flex: 1; height: 5px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                    <div style="width: ${percentage}%; height: 100%; background: ${strengthColor}; transition: all 0.3s;"></div>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: ${strengthColor}; min-width: 60px;">${strengthText}</span>
            </div>
        `;
    }
}

// Initialize validator globally
const formValidator = new FormValidator();

// Auto-initialize forms when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize common forms
    const forms = ['loginForm', 'registerForm', 'bookingForm', 'contactForm', 'createEventForm'];
    forms.forEach(formId => {
        if (document.getElementById(formId)) {
            formValidator.initializeForm(formId);
        }
    });
});

// Make validator available globally
window.FormValidator = FormValidator;
window.formValidator = formValidator;
