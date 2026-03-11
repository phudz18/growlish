const pool = require('../config/db');

const RolePermission = {
    addPermissionToRole: async (roleId, permissionId) => {
        await pool.query(
            'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permissionId]
        );
    }
};

module.exports = RolePermission;

