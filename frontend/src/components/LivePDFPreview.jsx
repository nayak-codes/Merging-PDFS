import { useState, useEffect } from 'react';

export default function LivePDFPreview({ file, operations = [] }) {
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
        if (file?.fileUrl) {
            // Construct full URL for backend if it's a relative path
            const url = file.fileUrl.startsWith('http')
                ? file.fileUrl
                : `http://localhost:5000${file.fileUrl}`;
            setPdfUrl(url);
        }
    }, [file]);

    // Filter operations for rendering overlays
    const textOperations = operations.filter(op => op.type === 'addText');
    const watermarkOp = operations.find(op => op.type === 'addWatermark');
    const rotationOps = operations.filter(op => op.type === 'rotatePage');
    const deleteOps = operations.filter(op => op.type === 'deletePage');

    // Calculate total rotation for page 0
    const totalRotation = rotationOps
        .filter(op => op.pageIndex === 0)
        .reduce((sum, op) => sum + (op.rotation || 0), 0) % 360;

    // Check if page 0 is deleted
    const isPageDeleted = deleteOps.some(op => op.pageIndex === 0);

    if (!pdfUrl) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No PDF to preview</p>
            </div>
        );
    }

    return (
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Live Preview</h3>
                        <p className="text-sm text-gray-600">
                            {operations.length > 0 ? `${operations.length} edit(s) applied` : 'No edits yet'}
                        </p>
                    </div>
                    {isPageDeleted && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                            Page 1 Deleted
                        </span>
                    )}
                </div>
            </div>

            <div className="p-8 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                    {isPageDeleted ? (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
                            <div className="text-red-600 text-6xl mb-4">🗑️</div>
                            <h4 className="text-lg font-semibold text-red-900 mb-2">Page Deleted</h4>
                            <p className="text-sm text-red-700">
                                This page will be removed when you merge the PDFs
                            </p>
                        </div>
                    ) : (
                        <div
                            className="relative bg-white rounded-lg shadow-2xl overflow-hidden"
                            style={{
                                transform: `rotate(${totalRotation}deg)`,
                                transition: 'transform 0.3s ease'
                            }}
                        >
                            {/* PDF iframe */}
                            <div className="relative" style={{ minHeight: '600px' }}>
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-full border-0"
                                    style={{ minHeight: '600px' }}
                                    title="PDF Preview"
                                />

                                {/* Watermark Overlay */}
                                {watermarkOp && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'transparent' }}>
                                        <div
                                            className="text-gray-400 font-bold text-6xl opacity-30 transform rotate-[-45deg] select-none"
                                            style={{
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            {watermarkOp.text}
                                        </div>
                                    </div>
                                )}

                                {/* Text Annotations Overlay */}
                                {textOperations.map((op, idx) => (
                                    <div
                                        key={idx}
                                        className="absolute pointer-events-none animate-pulse-once"
                                        style={{
                                            left: `${op.x || 100}px`,
                                            top: `${op.y || 100}px`,
                                            fontSize: `${op.size || 12}px`,
                                            color: op.color || '#000000',
                                            fontFamily: op.fontName || 'Helvetica',
                                            fontWeight: 'bold',
                                            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                                            zIndex: 10
                                        }}
                                    >
                                        {op.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Operations Summary */}
                    {operations.length > 0 && (
                        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Applied Edits:</h4>
                            <div className="space-y-2">
                                {textOperations.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                            {textOperations.length}
                                        </span>
                                        <span className="text-gray-700">Text annotation(s) added</span>
                                    </div>
                                )}
                                {watermarkOp && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                                            1
                                        </span>
                                        <span className="text-gray-700">Watermark applied</span>
                                    </div>
                                )}
                                {rotationOps.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                                            {totalRotation}°
                                        </span>
                                        <span className="text-gray-700">Page rotated</span>
                                    </div>
                                )}
                                {deleteOps.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                                            {deleteOps.length}
                                        </span>
                                        <span className="text-gray-700">Page(s) will be deleted</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
