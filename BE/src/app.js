const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const http = require('http');
const cookieParser = require('cookie-parser');


const { attachSocket } = require('./config/socket');
const authRoutes = require('./routes/auth.routes');
const { authenticate, requireRoles } = require('./middleware/auth.middleware');

dotenv.config();

const app = express();
const server = http.createServer(app);

attachSocket(server);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);

app.get('/api/admin/lessons', authenticate, requireRoles('admin'), (req, res) => {
    res.json({ message: 'Only admins can access lessons (RBAC example)' });
});

app.get('/api/user/profile', authenticate, (req, res) => {
    res.json({ message: 'User profile (authenticated user)' });
});

app.use((err, req, res, next) => {
    
    console.error(err);

    const status = err.statusCode || 500;
    const message = err.message || 'Server error';

    res.status(status).json({
        message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    
    console.log(`Server is running on port ${PORT}`);
});

