import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { fileAPI, mergeAPI } from '../services/api';
import {
    Upload,
    FileText,
    Trash2,
    ArrowLeft,
    Combine,
    GripVertical,
    CheckCircle,
    AlertCircle,
    Loader,
    Edit
} from 'lucide-react';

export default function Merger() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [operationName, setOperationName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [merging, setMerging] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // Auto-focus on upload if coming from dashboard
        if (location.state?.action === 'upload') {
            fileInputRef.current?.click();
        }
    }, [location]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files).filter(
            (file) => file.type === 'application/pdf'
        );

        if (files.length > 0) {
            handleFiles(files);
        } else {
            setError('Please upload only PDF files');
        }
    };

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = (files) => {
        setSelectedFiles((prev) => [...prev, ...files]);
        setError('');
    };

    const uploadFiles = async () => {
        if (selectedFiles.length === 0) {
            setError('Please select files to upload');
            return;
        }

        setUploading(true);
        try {
            const response = await fileAPI.upload(selectedFiles);

            if (response.success) {
                // Navigate to edit & merge page with uploaded files
                navigate('/edit-and-merge', {
                    state: { uploadedFiles: response.data.files }
                });
            }
        } catch (error) {
            setError(error.error || 'Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const removeUploadedFile = (fileId) => {
        setUploadedFiles((prev) => prev.filter((f) => f._id !== fileId));
    };

    const moveFile = (fromIndex, toIndex) => {
        const newFiles = [...uploadedFiles];
        const [movedFile] = newFiles.splice(fromIndex, 1);
        newFiles.splice(toIndex, 0, movedFile);
        setUploadedFiles(newFiles);
    };

    const handleMerge = async () => {
        if (uploadedFiles.length < 2) {
            setError('Please upload at least 2 files to merge');
            return;
        }

        if (!operationName.trim()) {
            setError('Please enter a name for the merged document');
            return;
        }

        setMerging(true);
        setError('');

        try {
            const fileIds = uploadedFiles.map((f) => f._id);
            const response = await mergeAPI.merge(fileIds, operationName);

            if (response.success) {
                setSuccess('PDFs merged successfully!');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            setError(error.error || 'Failed to merge PDFs');
        } finally {
            setMerging(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">PDF Merger</h1>
                    <p className="text-gray-600 mt-2">Upload and merge your PDF documents</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Step 1: Upload Files
                            </h2>

                            {/* Drag and Drop Area */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-gray-300 hover:border-primary-400'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Drop PDF files here
                                </h3>
                                <p className="text-gray-600 mb-4">or</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    multiple
                                    onChange={handleFileInput}
                                    className="hidden"
                                    id="file-input"
                                />
                                <label
                                    htmlFor="file-input"
                                    className="btn btn-primary cursor-pointer"
                                >
                                    <Upload className="w-5 h-5" />
                                    Choose Files
                                </label>
                                <p className="text-xs text-gray-500 mt-4">
                                    Maximum file size: 10MB per file
                                </p>
                            </div>

                            {/* Selected Files (Not Uploaded Yet) */}
                            {selectedFiles.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Selected Files ({selectedFiles.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {file.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatFileSize(file.size)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeSelectedFile(index)}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={uploadFiles}
                                        disabled={uploading}
                                        className="btn btn-primary w-full mt-4 disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader className="w-5 h-5 spinner" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-5 h-5" />
                                                Upload {selectedFiles.length} File(s)
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Merge Section */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Combine className="w-5 h-5" />
                                Step 2: Arrange & Merge
                            </h2>

                            {/* Alerts */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-4 animate-slide-up">
                                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2 mb-4 animate-slide-up">
                                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm">{success}</p>
                                </div>
                            )}

                            {/* Uploaded Files List */}
                            {uploadedFiles.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600">No files uploaded yet</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Upload at least 2 files to start merging
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Merged Document Name
                                        </label>
                                        <input
                                            type="text"
                                            value={operationName}
                                            onChange={(e) => setOperationName(e.target.value)}
                                            placeholder="e.g., Combined Report 2025"
                                            className="input"
                                        />
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Files to merge ({uploadedFiles.length})
                                        </p>
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={file._id}
                                                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg group hover:border-primary-300 transition-colors"
                                            >
                                                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                                                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <span className="text-sm font-bold text-primary-600">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">
                                                        {file.originalFileName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {file.metadata?.pageCount || 0} pages •{' '}
                                                        {formatFileSize(file.fileSize)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        to={`/editor/${file._id}`}
                                                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Edit PDF before merging"
                                                    >
                                                        <Edit className="w-4 h-4 text-blue-600" />
                                                    </Link>
                                                    <button
                                                        onClick={() => removeUploadedFile(file._id)}
                                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleMerge}
                                        disabled={merging || uploadedFiles.length < 2}
                                        className="btn btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {merging ? (
                                            <>
                                                <Loader className="w-5 h-5 spinner" />
                                                Merging PDFs...
                                            </>
                                        ) : (
                                            <>
                                                <Combine className="w-5 h-5" />
                                                Merge {uploadedFiles.length} Files
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Info Card */}
                        <div className="card bg-blue-50 border-blue-200">
                            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Click Edit (✏️) to remove pages or add text before merging</li>
                                <li>• Drag files to reorder them before merging</li>
                                <li>• Original files are preserved after merging</li>
                                <li>• Check merge history in the dashboard</li>
                                <li>• Download merged PDFs anytime</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
