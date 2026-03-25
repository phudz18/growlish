const validate = require('./validate');

const passwordStrengthMessage =
    'password must be at least 8 characters and include at least 1 uppercase letter, 1 lowercase letter, and 1 number';

const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const registerValidator = validate([
    { field: 'username', required: true, minLength: 3 },
    { field: 'email', required: true, type: 'email' },
    {
        field: 'password',
        required: false,
        minLength: 8,
        pattern: strongPasswordPattern,
        patternMessage: passwordStrengthMessage
    }
]);

const loginValidator = validate([
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, minLength: 1 }
]);

const refreshValidator = validate([
    { field: 'refreshToken', required: true, minLength: 10 }
]);

const logoutValidator = validate([
    { field: 'refreshToken', required: true, minLength: 10 }
]);

const oauthCallbackValidator = validate([
    { field: 'provider', required: true, oneOf: ['google', 'facebook', 'github'] },
    { field: 'token', required: true, minLength: 10 }
]);

module.exports = {
    registerValidator,
    loginValidator,
    refreshValidator,
    logoutValidator,
    oauthCallbackValidator
};

