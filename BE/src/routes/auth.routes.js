const express = require('express');
const multer = require('multer');
const AuthController = require('../controllers/auth.controller');
const { loginRateLimiter } = require('../middleware/rateLimit.middleware');
const {
    registerValidator,
    loginValidator,
    refreshValidator,
    logoutValidator,
    oauthCallbackValidator
} = require('../validators/auth.validator');

const router = express.Router();
const upload = multer();

router.post('/register', upload.none(), registerValidator, AuthController.register);
router.post('/login', loginRateLimiter, upload.none(), loginValidator, AuthController.login);
router.post('/refresh', upload.none(), refreshValidator, AuthController.refresh);
router.post('/logout', upload.none(), logoutValidator, AuthController.logout);

// Endpoint chung cho callback OAuth sau khi frontend đã lấy được profile từ provider
router.post('/oauth/callback', upload.none(), oauthCallbackValidator, AuthController.oauthCallback);

module.exports = router;

