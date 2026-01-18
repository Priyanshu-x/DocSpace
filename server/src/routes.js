const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prisma, isAdmin } = require('./auth');

const fileRouter = express.Router();

// Multer Config with Cloudinary
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'uploads',
        resource_type: 'auto', // Allow images, videos, etc.
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB Limit for Cloudinary (Free tier has limits)
        files: 5
    }
});

// Upload Files (support folderId)
fileRouter.post('/upload', upload.array('files', 5), async (req, res) => {
    try {
        const files = req.files;
        const folderId = req.body.folderId ? parseInt(req.body.folderId) : null;

        if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

        const fileRecords = await Promise.all(files.map(file => {
            return prisma.file.create({
                data: {
                    filename: file.filename, // Cloudinary public_id
                    originalName: file.originalname,
                    path: file.path, // Cloudinary Secure URL
                    size: file.size || 0, // Cloudinary might not always return size immediately in all configs
                    mimeType: file.mimetype,
                    userId: req.user.id,
                    folderId: folderId
                }
            });
        }));

        res.status(201).json({ message: 'Files uploaded', files: fileRecords });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Create Folder
fileRouter.post('/folders', async (req, res) => {
    try {
        const { name, parentId } = req.body;
        if (!name) return res.status(400).json({ error: 'Folder name required' });

        const folder = await prisma.folder.create({
            data: {
                name,
                userId: req.user.id,
                parentId: parentId ? parseInt(parentId) : null
            }
        });
        res.status(201).json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List Folders (Root or by Parent)
fileRouter.get('/folders', async (req, res) => {
    try {
        const parentId = req.query.parentId ? parseInt(req.query.parentId) : null;
        const folders = await prisma.folder.findMany({
            where: {
                userId: req.user.id,
                parentId: parentId
            }
        });
        res.json(folders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List User Files (with Pagination, Sorting, & Folder)
fileRouter.get('/files', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order || 'desc';
        const search = req.query.search || '';

        // Handle folderId: 'root' (null), specific ID, or undefined (all)
        let folderIdFilter = undefined;
        if (req.query.folderId === 'root') {
            folderIdFilter = null;
        } else if (req.query.folderId) {
            folderIdFilter = parseInt(req.query.folderId);
        }

        const where = {
            userId: req.user.id,
            originalName: {
                contains: search
            },
            folderId: folderIdFilter
        };

        const [files, total] = await Promise.all([
            prisma.file.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: order
                }
            }),
            prisma.file.count({ where })
        ]);

        res.json({
            data: files,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Folder Details (Breadcrumbs, etc)
fileRouter.get('/folders/:id', async (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const folder = await prisma.folder.findUnique({
            where: { id: folderId },
            include: { parent: true }
        });

        if (!folder) return res.status(404).json({ error: 'Folder not found' });
        if (folder.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

        res.json(folder);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Folder (Cascade actions)
fileRouter.delete('/folders/:id', async (req, res) => {
    try {
        const folderId = parseInt(req.params.id);
        const folder = await prisma.folder.findUnique({ where: { id: folderId } });

        if (!folder) return res.status(404).json({ error: 'Folder not found' });
        if (folder.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

        // 1. Find all files in this folder (Simple cascade)
        const files = await prisma.file.findMany({ where: { folderId } });

        // 2. Delete files from Cloudinary
        for (const file of files) {
            await cloudinary.uploader.destroy(file.filename);
        }

        // 3. Delete files from DB
        await prisma.file.deleteMany({ where: { folderId } });

        // 4. Delete the folder
        await prisma.folder.delete({ where: { id: folderId } });

        res.json({ message: 'Folder deleted' });
    } catch (error) {
        console.error('Delete folder error:', error);
        res.status(500).json({ error: error.message });
    }
});

// List All Files (Admin)
fileRouter.get('/admin/files', isAdmin, async (req, res) => {
    try {
        const files = await prisma.file.findMany({ include: { user: true } });
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Download File
fileRouter.get('/files/:id/download', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await prisma.file.findUnique({ where: { id: fileId } });

        if (!file) return res.status(404).json({ error: 'File not found' });

        // Check access: Owner or Admin
        if (file.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // For Cloudinary, we redirect to the secure URL
        res.redirect(file.path);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete File
fileRouter.delete('/files/:id', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await prisma.file.findUnique({ where: { id: fileId } });

        if (!file) return res.status(404).json({ error: 'File not found' });

        // Check access
        if (file.userId !== req.user.id && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete from DB
        await prisma.file.delete({ where: { id: fileId } });

        // Delete from Cloudinary
        // Filename in DB is stored as public_id for Cloudinary
        await cloudinary.uploader.destroy(file.filename);

        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin: List Users
fileRouter.get('/admin/users', isAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    } catch (error) {
        console.error('Admin list users error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Admin: Block/Unblock User
fileRouter.patch('/admin/users/:id', isAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { isBlocked } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isBlocked }
        });

        res.json(user);
    } catch (error) {
        console.error('Admin user update error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Share File
const crypto = require('crypto');
fileRouter.post('/files/:id/share', async (req, res) => {
    try {
        const fileId = parseInt(req.params.id);
        const file = await prisma.file.findUnique({ where: { id: fileId } });

        if (!file) return res.status(404).json({ error: 'File not found' });
        if (file.userId !== req.user.id) return res.status(403).json({ error: 'Access denied' });

        // Generate unique token
        const token = crypto.randomBytes(16).toString('hex');

        // Optional: Set expiry (e.g., 7 days)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const shareLink = await prisma.shareLink.create({
            data: {
                token,
                fileId,
                expiresAt
            }
        });

        const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/share/${token}`;
        res.json({ link, token, expiresAt });
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: 'Failed to create share link' });
    }
});

const shareRouter = express.Router();

// Get Shared File (Public) - Moved to shareRouter
shareRouter.get('/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const shareLink = await prisma.shareLink.findUnique({
            where: { token },
            include: { file: true }
        });

        if (!shareLink) return res.status(404).json({ error: 'Link not found or invalid' });

        if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
            return res.status(410).json({ error: 'Link expired' });
        }

        // Increment views
        await prisma.shareLink.update({
            where: { id: shareLink.id },
            data: { views: { increment: 1 } }
        });

        res.json({
            filename: shareLink.file.originalName,
            size: shareLink.file.size,
            mimeType: shareLink.file.mimeType,
            downloadUrl: shareLink.file.path,
            createdAt: shareLink.createdAt,
            expiresAt: shareLink.expiresAt
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = { fileRouter, shareRouter };
