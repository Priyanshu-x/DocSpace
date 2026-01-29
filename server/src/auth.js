const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const authRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Check Auth Status (Me)
authRouter.get('/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Invalid token' });
        // Return minimal user info, or fetch fresh from DB
        // Fetching fresh from DB is safer for role changes
        prisma.user.findUnique({ where: { id: decoded.id } })
            .then(user => {
                if (!user) return res.status(401).json({ error: 'User not found' });
                res.json({ user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
            })
            .catch(() => res.status(500).json({ error: 'Server error' }));
    });
});

// Register
authRouter.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Basic validation
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        // First user is admin? Let's keep it simple: manual admin assignment or special code.
        // For now, default false.
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword
            }
        });

        res.status(201).json({ message: 'User created' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login
authRouter.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.isBlocked) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, email: user.email, isAdmin: user.isAdmin },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.json({ message: 'Logged in', user: { id: user.id, email: user.email, isAdmin: user.isAdmin } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Guest Login (Shared Account)
authRouter.post('/guest', async (req, res) => {
    try {
        const SHARED_GUEST_EMAIL = 'creator@docspace.com';

        // Try to find the existing shared guest
        let user = await prisma.user.findUnique({
            where: { email: SHARED_GUEST_EMAIL }
        });

        // If not found, create it (First time only)
        if (!user) {
            const hashedPassword = await bcrypt.hash('shared_guest_password', 10);
            user = await prisma.user.create({
                data: {
                    email: SHARED_GUEST_EMAIL,
                    password: hashedPassword,
                    isGuest: true
                }
            });
            console.log('Created shared guest account:', user.id);
        }

        // Generate Token for this shared user
        const token = jwt.sign(
            { id: user.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ message: 'Guest login successful', user: { id: user.id, email: user.email, isAdmin: user.isAdmin, isGuest: user.isGuest } });
    } catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ error: 'Failed to create guest session' });
    }
});

// Logout
authRouter.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = decoded;
        next();
    });
};

// Middleware to check admin
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
};

module.exports = { authRouter, verifyToken, isAdmin, prisma };
