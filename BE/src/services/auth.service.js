const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const pool = require('../config/db');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const LoginHistory = require('../models/loginHistory.model');
const Role = require('../models/role.model');
const UserRole = require('../models/userRole.model');
const OAuthAccount = require('../models/oauthAccount.model');

const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '30', 10);
const ACCOUNT_LOCKOUT_MINUTES = parseInt(process.env.ACCOUNT_LOCKOUT_MINUTES || '15', 10);
const MAX_FAILED_LOGIN_ATTEMPTS = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS || '5', 10);

const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

const generateTokens = async (user, device = 'unknown', ip = 'unknown') => {
    const payload = {
        sub: user.user_id,
        email: user.email
    };

    const accessToken = jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d` }
    );

    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await Token.saveRefreshToken(user.user_id, tokenHash, device, ip, expiresAt);

    return { accessToken, refreshToken };
};

const AuthService = {
    register: async ({ username, email, password }) => {
        const existing = await User.findByEmail(email);
        if (existing) {
            const error = new Error('Email is already in use');
            error.statusCode = 400;
            throw error;
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const userId = await User.createUser(
                {
                    username,
                    email,
                    password_hash: passwordHash
                },
                connection
            );

            const userRole = await Role.createIfNotExists('user', connection);
            await UserRole.addRoleToUser(userId, userRole.role_id, connection);

            await connection.commit();

            return {
                user_id: userId,
                username,
                email
            };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    },

    loginWithEmail: async ({ email, password, ipAddress, userAgent }) => {
        const user = await User.findByEmail(email);
        if (!user) {
            await LoginHistory.create({
                userId: null,
                ipAddress,
                userAgent,
                isSuccess: false
            });

            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        if (!user.email_verified) {
            const error = new Error('Email is not verified');
            error.statusCode = 403;
            throw error;
        }

        const lastAttempts = await LoginHistory.getLastAttempts(user.user_id, MAX_FAILED_LOGIN_ATTEMPTS);
        if (lastAttempts.length === MAX_FAILED_LOGIN_ATTEMPTS) {
            const allFailed = lastAttempts.every((a) => !a.is_success);
            if (allFailed) {
                const lastAttemptAt = new Date(lastAttempts[0].created_at);
                const lockUntil = new Date(lastAttemptAt.getTime() + ACCOUNT_LOCKOUT_MINUTES * 60 * 1000);
                if (Date.now() < lockUntil.getTime()) {
                    const error = new Error(`Account is temporarily locked. Try again after ${lockUntil.toISOString()}`);
                    error.statusCode = 423;
                    throw error;
                }
            }
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        const isSuccess = !!isMatch;

        await LoginHistory.create({
            userId: user.user_id,
            ipAddress,
            userAgent,
            isSuccess
        });

        if (!isMatch) {
            const error = new Error('Invalid email or password');
            error.statusCode = 401;
            throw error;
        }

        await User.updateLastLogin(user.user_id);

        const tokens = await generateTokens(user, userAgent, ipAddress);
        const roles = await Role.getRolesForUser(user.user_id);

        return {
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                roles
            },
            tokens
        };
    },

    refreshTokens: async (refreshToken,  ipAddress = 'unknown', userAgent = 'unknown') => {
        if (!refreshToken) {
            const error = new Error('Missing refresh token');
            error.statusCode = 400;
            throw error;
        }

        let payload;
        try {
            payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            const error = new Error('Invalid refresh token');
            error.statusCode = 401;
            throw error;
        }

        const tokenHash = hashToken(refreshToken);
        const stored = await Token.findToken(tokenHash);
        if (!stored) {
            const error = new Error('Refresh token is revoked or does not exist');
            error.statusCode = 401;
            throw error;
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        const tokens = await generateTokens(user);
        const roles = await Role.getRolesForUser(user.user_id);

        return {
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                roles
            },
            tokens
        };
    },

    logout: async ({ refreshToken }) => {
        if (!refreshToken) {
            return;
        }

        const tokenHash = hashToken(refreshToken);
        const stored = await Token.findToken(tokenHash);
        if (!stored) return;

        await Token.revokeToken(stored.id);
    },

    loginWithOAuthProfile: async ({ provider, providerUserId, email, username, accessToken, refreshToken }) => {
        let user = await User.findByEmail(email);

        if (user) {
           
        } else {
            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                const [result] = await connection.query(
                    'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
                    [username, email, '', 1]
                );

                const userId = result.insertId;
                const userRole = await Role.createIfNotExists('user', connection);
                await UserRole.addRoleToUser(userId, userRole.role_id, connection);

                await connection.commit();

                user = {
                    user_id: userId,
                    username,
                    email
                };
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }
        }

        await OAuthAccount.create({
            userId: user.user_id,
            provider,
            providerUserId,
            accessToken,
            refreshToken
        });

        const tokens = await generateTokens(user);
        const roles = await Role.getRolesForUser(user.user_id);

        return {
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                roles
            },
            tokens
        };
    }
};

module.exports = AuthService;

