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

    createUser: async (userData, connection) => {
        const { username, email, password_hash } = userData;
        const [result] = await connection.query(
            'INSERT INTO users (username, email, password_hash, email_verified) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, 0]
        );
        return result.insertId;
    },

    createOAuthUser: async ({ username, email }, connection) => {
        const [result] = await connection.query(
            `INSERT INTO users (username, email, password_hash, email_verified)
             VALUES (?, ?, ?, ?)`,
            [username, email, '', 1] 
        );

        return result.insertId;
    },

    updateLastLogin: async (userId) => {
        await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userId]);
    }
};

module.exports = User;
