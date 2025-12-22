import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import { authenticate } from '../middleware/auth.js';
import File from '../models/File.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = process.env.UPLOAD_PATH || './uploads';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
    }
});

// @route   POST /api/v1/files/upload
// @desc    Upload single or multiple PDF files
// @access  Private
router.post('/upload', authenticate, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No files uploaded'
            });
        }

        const uploadedFiles = [];

        // Process each uploaded file
        for (const file of req.files) {
            try {
                // Read PDF to get metadata
                const pdfBytes = fs.readFileSync(file.path);
                const pdfDoc = await PDFDocument.load(pdfBytes);
                const pageCount = pdfDoc.getPageCount();
                const firstPage = pdfDoc.getPage(0);
                const { width, height } = firstPage.getSize();

                // Create file record in database
                const fileRecord = await File.create({
                    userId: req.user._id,
                    originalFileName: file.originalname,
                    storedFileName: file.filename,
                    fileUrl: `/uploads/${file.filename}`,
                    fileSize: file.size,
                    mimeType: file.mimetype,
                    metadata: {
                        pageCount,
                        width,
                        height
                    }
                });

                uploadedFiles.push(fileRecord);
            } catch (error) {
                console.error(`Error processing file ${file.originalname}:`, error);
                // Delete file if database record creation fails
                fs.unlinkSync(file.path);
            }
        }

        res.status(201).json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            data: {
                files: uploadedFiles
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Error uploading files'
        });
    }
});

// @route   GET /api/v1/files
// @desc    Get all files for authenticated user
// @access  Private
router.get('/', authenticate, async (req, res) => {
    try {
        const files = await File.find({
            userId: req.user._id,
            status: 'active'
        }).sort({ uploadTimestamp: -1 });

        res.json({
            success: true,
            data: {
                count: files.length,
                files
            }
        });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching files'
        });
    }
});

// @route   GET /api/v1/files/:fileId
// @desc    Get file details by ID
// @access  Private
router.get('/:fileId', authenticate, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            userId: req.user._id
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        res.json({
            success: true,
            data: {
                file
            }
        });
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching file'
        });
    }
});

// @route   DELETE /api/v1/files/:fileId
// @desc    Delete file by ID
// @access  Private
router.delete('/:fileId', authenticate, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            userId: req.user._id
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Mark as deleted instead of removing
        file.status = 'deleted';
        await file.save();

        // Optionally delete physical file
        const filePath = path.join(process.env.UPLOAD_PATH || './uploads', file.storedFileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({
            success: false,
            error: 'Error deleting file'
        });
    }
});

// @route   PUT /api/v1/files/:fileId
// @desc    Update file metadata
// @access  Private
router.put('/:fileId', authenticate, async (req, res) => {
    try {
        const file = await File.findOne({
            _id: req.params.fileId,
            userId: req.user._id
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Update allowed fields
        if (req.body.originalFileName) {
            file.originalFileName = req.body.originalFileName;
        }

        await file.save();

        res.json({
            success: true,
            message: 'File updated successfully',
            data: {
                file
            }
        });
    } catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({
            success: false,
            error: 'Error updating file'
        });
    }
});

export default router;
