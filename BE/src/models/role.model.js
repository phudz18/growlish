const pool = require('../config/db');

const Role = {
    findByName: async (roleName, connection = null) => {
        const executor = connection || pool;
        const [rows] = await executor.query(
            'SELECT * FROM roles WHERE role_name = ?',
            [roleName]
        );
        return rows[0];
    },

    createIfNotExists: async (roleName, connection = null) => {
        const executor = connection || pool;
        const existing = await Role.findByName(roleName, connection);
        if (existing) return existing;

        const [result] = await executor.query(
            'INSERT INTO roles (role_name) VALUES (?)',
            [roleName]
        );

        return { role_id: result.insertId, role_name: roleName };
    },

    getRolesForUser: async (userId) => {
        const [rows] = await pool.query(
            `SELECT r.role_name
             FROM user_roles ur
             JOIN roles r ON ur.role_id = r.role_id
             WHERE ur.user_id = ?`,
            [userId]
        );
        return rows.map((r) => r.role_name);
    }
};

module.exports = Role;

