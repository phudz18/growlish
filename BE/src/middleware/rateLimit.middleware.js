const rateLimit = require('express-rate-limit');

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: 'Too many login attempts, please try again later.'
    }
});

module.exports = {
    loginRateLimiter
};

