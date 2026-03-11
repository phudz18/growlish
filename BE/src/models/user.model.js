const pool = require('../config/db');

const User = {
    findByEmail: async (email) => {
        const [row] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return row[0];
    },

    findById: async (userId) => {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_id = ?', [userId]);
        return rows[0];
    },

    create: async (userData, connection) => {
        const { username, email, password_hash } = userData;
        const [result] = await connection.query(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );
        return result.insertId;
    },

    updateLastLogin: async (userId) => {
        await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userId]);
    }
};

module.exports = User;
