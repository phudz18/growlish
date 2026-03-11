const jwt = require('jsonwebtoken');
const Role = require('../models/role.model');
const Permission = require('../models/permission.model');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Missing access token' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = {
                id: payload.sub,
                email: payload.email
            };

            next();
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired access token' });
        }
    } catch (err) {
        next(err);
    }
};

const requireRoles = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Unauthenticated' });
            }

            const userRoles = await Role.getRolesForUser(req.user.id);

            const hasRole = roles.some((role) => userRoles.includes(role));
            if (!hasRole) {
                return res.status(403).json({ message: 'Access denied' });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

const requirePermissions = (...permissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: 'Unauthenticated' });
            }

            const userPermissions = await Permission.getPermissionsForUser(req.user.id);

            const hasPermission = permissions.every((p) => userPermissions.includes(p));
            if (!hasPermission) {
                return res.status(403).json({ message: 'Access denied' });
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

module.exports = {
    authenticate,
    requireRoles,
    requirePermissions
};

