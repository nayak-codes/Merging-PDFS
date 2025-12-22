import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { editorAPI } from '../services/api';
import PDFCanvasEditor from '../components/PDFCanvasEditor';
import {
    ArrowLeft,
    Trash2,
    Combine,
    Loader,
    CheckCircle
} from 'lucide-react';

export default function EditAndMerge() {
    const navigate = useNavigate();
    const location = useLocation();
    const filesFromState = location.state?.uploadedFiles || [];

    const [files, setFiles] = useState(filesFromState);
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [merging, setMerging] = useState(false);
    const [success, setSuccess] = useState('');
    const [operationName, setOperationName] = useState('');
    const [operations, setOperations] = useState({});

    const addOperation = (fileId, operation) => {
        setOperations(prev => ({
            ...prev,
            [fileId]: [...(prev[fileId] || []), operation]
        }));
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
        if (selectedFileIndex >= files.length - 1) {
            setSelectedFileIndex(Math.max(0, files.length - 2));
        }
    };

    const handleMergeAndDownload = async () => {
        if (files.length < 2) {
            alert('Need at least 2 files to merge');
            return;
        }

        if (!operationName.trim()) {
            alert('Please enter a name for the merged document');
            return;
        }

        setMerging(true);

        try {
            // Apply edits to each file that has operations
            const editedFileIds = [];

            for (const file of files) {
                if (operations[file._id] && operations[file._id].length > 0) {
                    const response = await editorAPI.modify(file._id, operations[file._id]);
                    if (response.success) {
                        editedFileIds.push(response.data.file._id);
                    }
                } else {
                    editedFileIds.push(file._id);
                }
            }

            // Merge all files
            const mergeResponse = await fetch('/api/v1/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    fileIds: editedFileIds,
                    operationName
                })
            });

            const mergeData = await mergeResponse.json();

            if (mergeData.success) {
                setSuccess('Files merged successfully!');

                // Auto download
                const downloadUrl = mergeData.data.mergedFile.fileUrl;
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `${operationName}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            }
        } catch (error) {
            console.error('Merge error:', error);
            alert('Failed to merge PDFs');
        } finally {
            setMerging(false);
        }
    };

    if (files.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">No files to edit</h2>
                    <button onClick={() => navigate('/merge')} className="btn btn-primary">
                        Go to Upload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/merge')} className="btn btn-secondary">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Edit & Merge PDFs</h1>
                            <p className="text-sm text-gray-600">{files.length} files ready to merge</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={operationName}
                            onChange={(e) => setOperationName(e.target.value)}
                            placeholder="Merged file name..."
                            className="input w-64"
                        />
                        <button
                            onClick={handleMergeAndDownload}
                            disabled={merging || files.length < 2}
                            className="btn btn-primary"
                        >
                            {merging ? (
                                <>
                                    <Loader className="w-4 h-4 spinner" />
                                    Merging...
                                </>
                            ) : (
                                <>
                                    <Combine className="w-4 h-4" />
                                    Merge & Download
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border-b border-green-200 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <p>{success}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - File List */}
                <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
                    <div className="p-4">
                        <h2 className="font-bold text-gray-900 mb-4">Files ({files.length})</h2>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={file._id}
                                    onClick={() => setSelectedFileIndex(index)}
                                    className={`p-3 rounded-lg cursor-pointer transition-all ${selectedFileIndex === index
                                        ? 'bg-primary-50 border-2 border-primary-500'
                                        : 'bg-gray-50 border-2 border-transparent hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-gray-900 truncate">
                                                {index + 1}. {file.originalFileName}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {file.metadata?.pageCount || 0} pages
                                            </p>
                                            {operations[file._id] && operations[file._id].length > 0 && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    ✏️ {operations[file._id].length} edit(s)
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="p-1 hover:bg-red-100 rounded"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Canvas Editor */}
                <div className="flex-1">
                    <PDFCanvasEditor
                        files={files}
                        operations={operations}
                        onOperationAdd={addOperation}
                        selectedFileIndex={selectedFileIndex}
                    />
                </div>
            </div>
        </div>
    );
}
