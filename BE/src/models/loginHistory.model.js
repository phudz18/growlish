const pool = require('../config/db');

const LoginHistory = {
    create: async ({ userId, ipAddress, userAgent, isSuccess }) => {
        await pool.query(
            'INSERT INTO login_history (user_id, ip_address, user_agent, is_success) VALUES (?, ?, ?, ?)',
            [userId, ipAddress, userAgent, isSuccess ? 1 : 0]
        );
    },

    getLastAttempts: async (userId, limit = 5) => {
        const [rows] = await pool.query(
            `SELECT is_success, created_at
             FROM login_history
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT ?`,
            [userId, limit]
        );
        return rows;
    }
};

module.exports = LoginHistory;

