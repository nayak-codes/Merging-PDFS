import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fileAPI, mergeAPI } from '../services/api';
import {
    FileText,
    Upload,
    History,
    LogOut,
    Trash2,
    Download,
    Combine,
    User,
    Calendar,
    FileStack
} from 'lucide-react';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [files, setFiles] = useState([]);
    const [mergeHistory, setMergeHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalMerges: 0,
        totalStorage: 0
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [filesData, historyData] = await Promise.all([
                fileAPI.getAll(),
                mergeAPI.getHistory()
            ]);

            if (filesData.success) {
                setFiles(filesData.data.files);
                const totalStorage = filesData.data.files.reduce((acc, file) => acc + file.fileSize, 0);
                setStats(prev => ({
                    ...prev,
                    totalFiles: filesData.data.count,
                    totalStorage
                }));
            }

            if (historyData.success) {
                setMergeHistory(historyData.data.operations);
                setStats(prev => ({
                    ...prev,
                    totalMerges: historyData.data.count
                }));
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            await fileAPI.delete(fileId);
            setFiles(files.filter(f => f._id !== fileId));
            setStats(prev => ({ ...prev, totalFiles: prev.totalFiles - 1 }));
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Failed to delete file');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">PDF Merger</h1>
                                <p className="text-xs text-gray-500">Document Management</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="btn btn-secondary"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card-hover">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Files</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalFiles}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card-hover">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Merges</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.totalMerges}</p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <Combine className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="card-hover">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Storage Used</p>
                                <p className="text-3xl font-bold text-gray-900">{formatFileSize(stats.totalStorage)}</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <FileStack className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                            to="/merge"
                            state={{ action: 'upload' }}
                            className="card-hover flex items-center gap-4 hover:border-primary-300 transition-colors cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                                <Upload className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    Upload PDFs
                                </h3>
                                <p className="text-sm text-gray-600">Upload and manage new files</p>
                            </div>
                        </Link>

                        <Link
                            to="/merge"
                            state={{ action: 'merge' }}
                            className="card-hover flex items-center gap-4 hover:border-purple-300 transition-colors cursor-pointer group"
                        >
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <Combine className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                    Merge PDFs
                                </h3>
                                <p className="text-sm text-gray-600">Combine multiple files into one</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Files */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Recent Files</h2>
                        {files.length > 0 && (
                            <Link to="/merge" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                View all →
                            </Link>
                        )}
                    </div>

                    {files.length === 0 ? (
                        <div className="card text-center py-12">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
                            <p className="text-gray-600 mb-6">Upload your first PDF to get started</p>
                            <Link to="/merge" className="btn btn-primary">
                                <Upload className="w-5 h-5" />
                                Upload Files
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {files.slice(0, 6).map((file) => (
                                <div key={file._id} className="card-hover">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">{file.originalFileName}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs text-gray-500">{formatFileSize(file.fileSize)}</span>
                                                    <span className="text-xs text-gray-500">{file.metadata?.pageCount || 0} pages</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <Calendar className="inline w-3 h-3 mr-1" />
                                                    {formatDate(file.uploadTimestamp)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={file.fileUrl}
                                                download
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Download"
                                            >
                                                <Download className="w-4 h-4 text-gray-600" />
                                            </a>
                                            <button
                                                onClick={() => handleDeleteFile(file._id)}
                                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Merge History */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Merge History
                        </h2>
                    </div>

                    {mergeHistory.length === 0 ? (
                        <div className="card text-center py-12">
                            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No merge history</h3>
                            <p className="text-gray-600">Your merged documents will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {mergeHistory.slice(0, 5).map((operation) => (
                                <div key={operation._id} className="card-hover">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{operation.operationName}</h4>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                                <span>{operation.sourceFileIds?.length || 0} files merged</span>
                                                <span>•</span>
                                                <span>{operation.mergeConfiguration?.totalPages || 0} total pages</span>
                                                <span>•</span>
                                                <span>{formatDate(operation.createdAt)}</span>
                                            </div>
                                        </div>
                                        <a
                                            href={operation.mergedFileId?.fileUrl}
                                            download
                                            className="btn btn-primary"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
