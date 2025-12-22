import express from 'express';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import File from '../models/File.js';

const router = express.Router();

// @route   POST /api/v1/editor/:fileId/modify
// @desc    Modify PDF with annotations, rotations, deletions
// @access  Private
router.post('/:fileId/modify', authenticate, async (req, res) => {
    try {
        const { fileId } = req.params;
        const { operations } = req.body;

        // Validate file ownership
        const file = await File.findOne({
            _id: fileId,
            userId: req.user._id,
            status: 'active'
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        // Load the PDF
        const filePath = path.join(process.env.UPLOAD_PATH || './uploads', file.storedFileName);
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Process operations
        for (const operation of operations) {
            switch (operation.type) {
                case 'addText':
                    await addTextToPDF(pdfDoc, operation);
                    break;
                case 'addWatermark':
                    await addWatermarkToPDF(pdfDoc, operation);
                    break;
                case 'rotatePage':
                    rotatePDFPage(pdfDoc, operation);
                    break;
                case 'deletePage':
                    // Will handle after all operations
                    break;
                case 'addImage':
                    await addImageToPDF(pdfDoc, operation);
                    break;
            }
        }

        // Handle page deletions (must be done after other operations)
        const pagesToDelete = operations
            .filter(op => op.type === 'deletePage')
            .map(op => op.pageIndex)
            .sort((a, b) => b - a); // Delete from end to start

        for (const pageIndex of pagesToDelete) {
            pdfDoc.removePage(pageIndex);
        }

        // Save the modified PDF
        const modifiedPdfBytes = await pdfDoc.save();
        const modifiedFileName = `edited-${uuidv4()}.pdf`;
        const modifiedFilePath = path.join(process.env.UPLOAD_PATH || './uploads', modifiedFileName);
        fs.writeFileSync(modifiedFilePath, modifiedPdfBytes);

        // Get dimensions of first page
        const firstPage = pdfDoc.getPage(0);
        const { width, height } = firstPage.getSize();

        // Create new file record
        const modifiedFile = await File.create({
            userId: req.user._id,
            originalFileName: `Edited_${file.originalFileName}`,
            storedFileName: modifiedFileName,
            fileUrl: `/uploads/${modifiedFileName}`,
            fileSize: modifiedPdfBytes.length,
            mimeType: 'application/pdf',
            metadata: {
                pageCount: pdfDoc.getPageCount(),
                width,
                height
            }
        });

        res.status(201).json({
            success: true,
            message: 'PDF modified successfully',
            data: {
                file: modifiedFile
            }
        });
    } catch (error) {
        console.error('PDF modification error:', error);
        res.status(500).json({
            success: false,
            error: 'Error modifying PDF'
        });
    }
});

// Helper functions
async function addTextToPDF(pdfDoc, operation) {
    const { pageIndex, text, x, y, size, color, fontName } = operation;
    const page = pdfDoc.getPage(pageIndex);

    let font;
    switch (fontName) {
        case 'Helvetica-Bold':
            font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            break;
        case 'Times-Roman':
            font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            break;
        case 'Courier':
            font = await pdfDoc.embedFont(StandardFonts.Courier);
            break;
        default:
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    const rgbColor = hexToRgb(color || '#000000');

    page.drawText(text, {
        x,
        y,
        size: size || 12,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b)
    });
}

async function addWatermarkToPDF(pdfDoc, operation) {
    const { text, opacity } = operation;
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    pages.forEach(page => {
        const { width, height } = page.getSize();

        page.drawText(text, {
            x: width / 2 - (text.length * 10),
            y: height / 2,
            size: 60,
            font,
            color: rgb(0.7, 0.7, 0.7),
            opacity: opacity || 0.3,
            rotate: degrees(45)
        });
    });
}

function rotatePDFPage(pdfDoc, operation) {
    const { pageIndex, rotation } = operation;
    const page = pdfDoc.getPage(pageIndex);

    page.setRotation(degrees(rotation));
}

async function addImageToPDF(pdfDoc, operation) {
    const { pageIndex, imageBase64, x, y, width, height, imageType } = operation;
    const page = pdfDoc.getPage(pageIndex);

    // Decode base64 image
    const imageBytes = Buffer.from(imageBase64, 'base64');

    let image;
    if (imageType === 'png') {
        image = await pdfDoc.embedPng(imageBytes);
    } else {
        image = await pdfDoc.embedJpg(imageBytes);
    }

    page.drawImage(image, {
        x,
        y,
        width,
        height
    });
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
}

export default router;
