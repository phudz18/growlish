const AuthService = require('../services/auth.service');

const badRequest = (res, message, details) => {
    return res.status(400).json({
        message,
        ...(details ? { details } : {})
    });
};

const setAuthCookies = (res, tokens) => {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieBase = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/'
    };

    res.cookie('accessToken', tokens.accessToken, {
        ...cookieBase,
        maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        ...cookieBase,
        maxAge: 30 * 24 * 60 * 60 * 1000
    });
};

const clearAuthCookies = (res) => {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieBase = {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        path: '/'
    };

    res.clearCookie('accessToken', cookieBase);
    res.clearCookie('refreshToken', cookieBase);
};

const AuthController = {
    register: async (req, res, next) => {
        try {
            const body = req.body || {};
            const { username, email, password } = body;

            if (!username || !email || !password) {
                return badRequest(
                    res,
                    'Missing registration data',
                    {
                        required: ['username', 'email', 'password'],
                        receivedContentType: req.headers['content-type'] || null
                    }
                );
            }

            const user = await AuthService.register({ username, email, password });

            return res.status(201).json({
                message: 'Registration successful',
                data: user
            });
        } catch (err) {
            next(err);
        }
    },

    login: async (req, res, next) => {
        try {
            const body = req.body || {};
            const { email, password } = body;

            if (!email || !password) {
                return badRequest(
                    res,
                    'Missing login data',
                    {
                        required: ['email', 'password'],
                        receivedContentType: req.headers['content-type'] || null
                    }
                );
            }

            const ipAddress = req.ip;
            const userAgent = req.headers['user-agent'] || '';

            const result = await AuthService.loginWithEmail({
                email,
                password,
                ipAddress,
                userAgent
            });

            setAuthCookies(res, result.tokens);

            return res.json({
                message: 'Login successful',
                data: {
                    user: result.user
                }
            });
        } catch (err) {
            next(err);
        }
    },

    refresh: async (req, res, next) => {
        try {
            const body = req.body || {};
            const refreshToken = body.refreshToken || (req.cookies ? req.cookies.refreshToken : null);

            if (!refreshToken) {
                return badRequest(
                    res,
                    'Missing refreshToken',
                    {
                        required: ['refreshToken'],
                        receivedContentType: req.headers['content-type'] || null
                    }
                );
            }

            const result = await AuthService.refreshTokens(refreshToken);

            setAuthCookies(res, result.tokens);

            return res.json({
                message: 'Token refreshed successfully',
                data: {
                    user: result.user
                }
            });
        } catch (err) {
            next(err);
        }
    },

    logout: async (req, res, next) => {
        try {
            const body = req.body || {};
            const refreshToken = body.refreshToken || (req.cookies ? req.cookies.refreshToken : null);

            if (!refreshToken) {
                return badRequest(
                    res,
                    'Missing refreshToken',
                    {
                        required: ['refreshToken'],
                        receivedContentType: req.headers['content-type'] || null
                    }
                );
            }

            await AuthService.logout({ refreshToken });
            clearAuthCookies(res);

            return res.json({
                message: 'Logout successful'
            });
        } catch (err) {
            next(err);
        }
    },

    oauthCallback: async (req, res, next) => {
        try {
            const body = req.body || {};
            const { provider, providerUserId, email, username, accessToken, refreshToken } = body;

            if (!provider || !providerUserId || !email || !username) {
                return badRequest(
                    res,
                    'Missing OAuth callback data',
                    {
                        required: ['provider', 'providerUserId', 'email', 'username'],
                        receivedContentType: req.headers['content-type'] || null
                    }
                );
            }

            const result = await AuthService.loginWithOAuthProfile({
                provider,
                providerUserId,
                email,
                username,
                accessToken,
                refreshToken
            });

            setAuthCookies(res, result.tokens);

            return res.json({
                message: 'OAuth login successful',
                data: {
                    user: result.user
                }
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = AuthController;

