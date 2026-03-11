const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const asString = (value) => (value === undefined || value === null ? '' : String(value));

const validate = (rules) => {
    return (req, res, next) => {
        const body = req.body || {};
        const errors = [];

        for (const rule of rules) {
            const value = body[rule.field];
            const str = asString(value).trim();

            if (rule.required && !str) {
                errors.push({ field: rule.field, message: `${rule.field} is required` });
                continue;
            }

            if (!str) continue;

            if (rule.type === 'email' && !isEmail(str)) {
                errors.push({ field: rule.field, message: `${rule.field} must be a valid email` });
            }

            if (rule.minLength && str.length < rule.minLength) {
                errors.push({
                    field: rule.field,
                    message: `${rule.field} must be at least ${rule.minLength} characters`
                });
            }

            if (rule.oneOf && !rule.oneOf.includes(str)) {
                errors.push({
                    field: rule.field,
                    message: `${rule.field} must be one of: ${rule.oneOf.join(', ')}`
                });
            }

            if (rule.pattern && !rule.pattern.test(str)) {
                errors.push({
                    field: rule.field,
                    message: rule.patternMessage || `${rule.field} is invalid`
                });
            }
        }

        if (errors.length) {
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }

        next();
    };
};

module.exports = validate;

