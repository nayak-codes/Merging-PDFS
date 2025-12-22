import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument } from 'pdf-lib';
import { authenticate } from '../middleware/auth.js';
import File from '../models/File.js';
import MergeOperation from '../models/MergeOperation.js';

const router = express.Router();

// @route   POST /api/v1/merge
// @desc    Merge multiple PDFs into one
// @access  Private
router.post('/', authenticate, async (req, res) => {
    try {
        const { fileIds, operationName } = req.body;

        // Validate input
        if (!fileIds || !Array.isArray(fileIds) || fileIds.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 files are required for merging'
            });
        }

        if (!operationName || operationName.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Operation name is required'
            });
        }

        // Fetch all files
        const files = await File.find({
            _id: { $in: fileIds },
            userId: req.user._id,
            status: 'active'
        });

        if (files.length !== fileIds.length) {
            return res.status(404).json({
                success: false,
                error: 'One or more files not found'
            });
        }

        // Create new PDF document for merging
        const mergedPdf = await PDFDocument.create();
        const fileOrder = [];
        let totalPages = 0;

        // Merge PDFs in the order specified
        for (const fileId of fileIds) {
            const file = files.find(f => f._id.toString() === fileId);
            if (!file) continue;

            const filePath = path.join(process.env.UPLOAD_PATH || './uploads', file.storedFileName);

            if (!fs.existsSync(filePath)) {
                return res.status(404).json({
                    success: false,
                    error: `File ${file.originalFileName} not found on disk`
                });
            }

            // Load PDF
            const pdfBytes = fs.readFileSync(filePath);
            const pdf = await PDFDocument.load(pdfBytes);

            // Copy all pages
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));

            fileOrder.push(file.originalFileName);
            totalPages += pdf.getPageCount();
        }

        // Save merged PDF
        const mergedPdfBytes = await mergedPdf.save();
        const mergedFileName = `merged-${uuidv4()}.pdf`;
        const mergedFilePath = path.join(process.env.UPLOAD_PATH || './uploads', mergedFileName);
        fs.writeFileSync(mergedFilePath, mergedPdfBytes);

        // Get dimensions of first page
        const firstPage = mergedPdf.getPage(0);
        const { width, height } = firstPage.getSize();

        // Create file record for merged PDF
        const mergedFile = await File.create({
            userId: req.user._id,
            originalFileName: `${operationName}.pdf`,
            storedFileName: mergedFileName,
            fileUrl: `/uploads/${mergedFileName}`,
            fileSize: mergedPdfBytes.length,
            mimeType: 'application/pdf',
            metadata: {
                pageCount: totalPages,
                width,
                height
            }
        });

        // Create merge operation record
        const mergeOperation = await MergeOperation.create({
            userId: req.user._id,
            operationName,
            sourceFileIds: fileIds,
            mergedFileId: mergedFile._id,
            mergeConfiguration: {
                fileOrder,
                totalPages
            },
            status: 'completed'
        });

        // Populate references
        await mergeOperation.populate('sourceFileIds mergedFileId');

        res.status(201).json({
            success: true,
            message: 'PDFs merged successfully',
            data: {
                mergeOperation,
                mergedFile
            }
        });
    } catch (error) {
        console.error('Merge error:', error);
        res.status(500).json({
            success: false,
            error: 'Error merging PDFs'
        });
    }
});

// @route   GET /api/v1/merge/history
// @desc    Get merge history for authenticated user
// @access  Private
router.get('/history', authenticate, async (req, res) => {
    try {
        const mergeOperations = await MergeOperation.find({
            userId: req.user._id
        })
            .populate('sourceFileIds mergedFileId')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            data: {
                count: mergeOperations.length,
                operations: mergeOperations
            }
        });
    } catch (error) {
        console.error('Error fetching merge history:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching merge history'
        });
    }
});

// @route   GET /api/v1/merge/:mergeId
// @desc    Get specific merge operation details
// @access  Private
router.get('/:mergeId', authenticate, async (req, res) => {
    try {
        const mergeOperation = await MergeOperation.findOne({
            _id: req.params.mergeId,
            userId: req.user._id
        }).populate('sourceFileIds mergedFileId');

        if (!mergeOperation) {
            return res.status(404).json({
                success: false,
                error: 'Merge operation not found'
            });
        }

        res.json({
            success: true,
            data: {
                operation: mergeOperation
            }
        });
    } catch (error) {
        console.error('Error fetching merge operation:', error);
        res.status(500).json({
            success: false,
            error: 'Error fetching merge operation'
        });
    }
});

// @route   POST /api/v1/merge/:mergeId/annotate
// @desc    Add annotations to merged PDF
// @access  Private
router.post('/:mergeId/annotate', authenticate, async (req, res) => {
    try {
        const mergeOperation = await MergeOperation.findOne({
            _id: req.params.mergeId,
            userId: req.user._id
        });

        if (!mergeOperation) {
            return res.status(404).json({
                success: false,
                error: 'Merge operation not found'
            });
        }

        const { type, content, position } = req.body;

        // Validate annotation data
        if (!type || !['text', 'highlight', 'stamp', 'image'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid annotation type'
            });
        }

        // Add annotation
        mergeOperation.annotations.push({
            type,
            content,
            position
        });

        await mergeOperation.save();

        res.json({
            success: true,
            message: 'Annotation added successfully',
            data: {
                operation: mergeOperation
            }
        });
    } catch (error) {
        console.error('Error adding annotation:', error);
        res.status(500).json({
            success: false,
            error: 'Error adding annotation'
        });
    }
});

export default router;
