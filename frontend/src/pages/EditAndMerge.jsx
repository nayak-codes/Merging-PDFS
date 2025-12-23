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
        setSuccess('');

        try {
            // Apply edits to each file that has operations
            const editedFileIds = [];

            for (const file of files) {
                if (operations[file._id] && operations[file._id].length > 0) {
                    console.log(`Applying ${operations[file._id].length} operations to file:`, file.originalFileName);
                    const response = await editorAPI.modify(file._id, operations[file._id]);
                    if (response.success) {
                        editedFileIds.push(response.data.file._id);
                    } else {
                        throw new Error(`Failed to apply edits to ${file.originalFileName}`);
                    }
                } else {
                    editedFileIds.push(file._id);
                }
            }

            console.log('Merging files:', editedFileIds);

            // Merge all files
            const mergeResponse = await fetch('http://localhost:5000/api/v1/merge', {
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
            console.log('Merge response:', mergeData);

            if (!mergeResponse.ok) {
                throw new Error(mergeData.message || 'Merge failed');
            }

            if (mergeData.success) {
                setSuccess('Files merged successfully!');

                // Auto download
                const downloadUrl = mergeData.data.mergedFile.fileUrl.startsWith('http')
                    ? mergeData.data.mergedFile.fileUrl
                    : `http://localhost:5000${mergeData.data.mergedFile.fileUrl}`;

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `${operationName}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                throw new Error(mergeData.message || 'Merge failed');
            }
        } catch (error) {
            console.error('Merge error:', error);
            alert(`Failed to merge PDFs: ${error.message}`);
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
        <div className="min-h-screen gradient-bg flex flex-col">
            {/* Premium Header */}
            <div className="bg-white border-b border-gray-100 shadow-xl relative overflow-hidden">
                {/* Gradient accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 gradient-primary"></div>

                <div className="max-w-full mx-auto px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/merge')}
                                className="btn btn-secondary hover:scale-110 transition-all group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                Back
                            </button>
                            <div className="border-l-2 border-gray-200 pl-6">
                                <h1 className="text-3xl font-bold text-gradient mb-1">
                                    Edit & Merge PDFs
                                </h1>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                        <span className="font-medium">{files.length} files ready</span>
                                    </div>
                                    <span className="text-gray-400">•</span>
                                    <div className="flex items-center gap-2">
                                        <span className="badge badge-primary animate-scale">
                                            {Object.values(operations).flat().length} edits
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="text"
                                value={operationName}
                                onChange={(e) => setOperationName(e.target.value)}
                                placeholder="Enter merged file name..."
                                className="input w-80 text-sm shadow-lg"
                            />
                            <button
                                onClick={handleMergeAndDownload}
                                disabled={merging || files.length < 2}
                                className="btn btn-primary px-8 py-3 text-base font-bold shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {merging ? (
                                    <>
                                        <Loader className="w-5 h-5 spinner" />
                                        <span>Merging...</span>
                                    </>
                                ) : (
                                    <>
                                        <Combine className="w-5 h-5" />
                                        <span>Merge & Download</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-200 shadow-lg animate-slide-up">
                    <div className="max-w-full mx-auto px-8 py-4">
                        <div className="flex items-center gap-3 text-green-700">
                            <CheckCircle className="w-6 h-6 animate-scale" />
                            <p className="font-semibold text-lg">{success}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Premium Sidebar */}
                <div className="w-80 bg-white border-r border-gray-100 overflow-y-auto shadow-2xl">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-bold text-gray-900 text-xl">Files</h2>
                            <span className="badge badge-primary text-base px-4 py-2">
                                {files.length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {files.map((file, index) => (
                                <div
                                    key={file._id}
                                    onClick={() => setSelectedFileIndex(index)}
                                    className={`group p-5 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-102 ${selectedFileIndex === index
                                        ? 'bg-gradient-to-br from-blue-50 via-blue-100 to-purple-50 border-2 border-blue-400 shadow-2xl shadow-blue-200 scale-102'
                                        : 'bg-gray-50 border-2 border-transparent hover:border-blue-200 hover:shadow-xl hover-lift'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className={`flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold shadow-lg transition-all ${selectedFileIndex === index
                                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white scale-110'
                                                    : 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 group-hover:from-blue-400 group-hover:to-purple-400 group-hover:text-white'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                <p className="font-bold text-base text-gray-900 truncate flex-1">
                                                    {file.originalFileName}
                                                </p>
                                            </div>
                                            <div className="ml-11 space-y-2">
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="font-semibold">{file.metadata?.pageCount || 0}</span> pages
                                                </p>
                                                {operations[file._id] && operations[file._id].length > 0 && (
                                                    <div className="animate-scale">
                                                        <span className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1.5 rounded-xl font-bold shadow-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            {operations[file._id].length} edit{operations[file._id].length > 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="p-2.5 hover:bg-red-100 rounded-xl transition-all group/delete hover:scale-110"
                                            title="Remove file"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-500 group-hover/delete:text-red-700 group-hover/delete:scale-110 transition-all" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Canvas Editor */}
                <div className="flex-1 overflow-hidden">
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
