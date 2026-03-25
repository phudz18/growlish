const pool = require('../config/db');

const Token = {
    saveRefreshToken: async (userId, tokenHash, device, ip, expiresAt) => {

        await pool.query(
            `INSERT INTO refresh_tokens
            (user_id, token_hash, device_info, ip_address, expires_at)
            VALUES (?, ?, ?, ?, ?)`,
            [userId, tokenHash, device, ip, expiresAt]
        );
    },

    findToken: async (tokenHash) => {
        const [rows] = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0',
            [tokenHash]
        );
        return rows[0];
    },

    revokeToken: async (tokenId) => {
        await pool.query(
            'UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE id = ?',
            [tokenId]
        );
    },

    revokeAllTokensForUser: async (userId) => {
        await pool.query(
            'UPDATE refresh_tokens SET revoked = 1, revoked_at = NOW() WHERE user_id = ? AND revoked = 0',
            [userId]
        );
    }
};

module.exports = Token;