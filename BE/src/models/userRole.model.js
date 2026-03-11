const pool = require('../config/db');

const UserRole = {
    addRoleToUser: async (userId, roleId, connection = null) => {
        const executor = connection || pool;
        await executor.query(
            'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
        );
    }
};

module.exports = UserRole;

