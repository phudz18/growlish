const pool = require('../config/db');

const Permission = {
    findByName: async (permissionName) => {
        const [rows] = await pool.query(
            'SELECT * FROM permissions WHERE permission_name = ?',
            [permissionName]
        );
        return rows[0];
    },

    createIfNotExists: async (permissionName) => {
        const existing = await Permission.findByName(permissionName);
        if (existing) return existing;

        const [result] = await pool.query(
            'INSERT INTO permissions (permission_name) VALUES (?)',
            [permissionName]
        );

        return { permission_id: result.insertId, permission_name: permissionName };
    },

    getPermissionsForUser: async (userId) => {
        const [rows] = await pool.query(
            `SELECT p.permission_name
             FROM user_roles ur
             JOIN role_permissions rp ON ur.role_id = rp.role_id
             JOIN permissions p ON rp.permission_id = p.permission_id
             WHERE ur.user_id = ?`,
            [userId]
        );
        return rows.map((p) => p.permission_name);
    }
};

module.exports = Permission;

