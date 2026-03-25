const pool = require('../config/db');

const LoginHistory = {
    create: async (userId, ip, device, status) => {

        await pool.query(
            `INSERT INTO login_history (user_id, ip_address, device_info, login_status) VALUES (?, ?, ?, ?)`,
            [userId, ip, device, status]
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

