import mongoose from 'mongoose';

const mergeOperationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    operationName: {
        type: String,
        required: true,
        trim: true
    },
    sourceFileIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    }],
    mergedFileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
        required: true
    },
    mergeConfiguration: {
        fileOrder: [String], // Array of original filenames in merge order
        totalPages: Number,
        compressionLevel: {
            type: String,
            enum: ['none', 'low', 'medium', 'high'],
            default: 'none'
        }
    },
    annotations: [{
        type: {
            type: String,
            enum: ['text', 'highlight', 'stamp', 'image']
        },
        content: String,
        position: {
            x: Number,
            y: Number,
            page: Number
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    errorMessage: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
mergeOperationSchema.index({ userId: 1, status: 1 });
mergeOperationSchema.index({ createdAt: -1 });

const MergeOperation = mongoose.model('MergeOperation', mergeOperationSchema);

export default MergeOperation;
