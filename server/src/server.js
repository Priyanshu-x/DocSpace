require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');

const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

const { authRouter, verifyToken, isAdmin } = require('./auth');
const { fileRouter, shareRouter } = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
    credentials: true
}));
app.use(express.json());
// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

app.use(cookieParser());


// Create uploads directory if not exists - REMOVED for Cloudinary
// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir);
// }

// Routes
app.use('/auth', authRouter);
app.use('/share', shareRouter); // Public sharing routes
app.use('/api', verifyToken, fileRouter);

// Serve uploads (Protected by verifyToken middleware in a real app, 
// for simplicity we might expose it or serve via an endpoint. 
// Let's serve via endpoint /files/:id/download to control access)

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    res.status(status).json({ error: message });
});

// Start Server only if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
