const pool = require('../config/db');

const OAuthAccount = {
    findByProvider: async (provider, providerUserId) => {
        const [rows] = await pool.query(
            'SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?',
            [provider, providerUserId]
        );
        return rows[0];
    },

    create: async ({ userId, provider, providerUserId, accessToken, refreshToken }) => {
        await pool.query(
            `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, access_token, refresh_token)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE access_token = VALUES(access_token), refresh_token = VALUES(refresh_token)`,
            [userId, provider, providerUserId, accessToken, refreshToken]
        );
    }
};

module.exports = OAuthAccount;

