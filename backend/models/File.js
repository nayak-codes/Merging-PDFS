import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    originalFileName: {
        type: String,
        required: true
    },
    storedFileName: {
        type: String,
        required: true,
        unique: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    mimeType: {
        type: String,
        required: true,
        default: 'application/pdf'
    },
    uploadTimestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'deleted', 'archived'],
        default: 'active'
    },
    metadata: {
        pageCount: {
            type: Number,
            default: 0
        },
        width: Number,
        height: Number,
        version: String
    }
}, {
    timestamps: true
});

// Index for faster queries
fileSchema.index({ userId: 1, status: 1 });
fileSchema.index({ uploadTimestamp: -1 });

const File = mongoose.model('File', fileSchema);

export default File;
