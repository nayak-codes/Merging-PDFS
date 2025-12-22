import { useState, useEffect } from 'react';

export default function MergedPDFPreview({ files, operations = {} }) {
    if (!files || files.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No files to preview</p>
            </div>
        );
    }

    // Get all operations across all files
    const allOperations = Object.values(operations).flat();
    const textOperations = allOperations.filter(op => op.type === 'addText');
    const watermarkOps = allOperations.filter(op => op.type === 'addWatermark');
    const rotationOps = allOperations.filter(op => op.type === 'rotatePage');
    const deleteOps = allOperations.filter(op => op.type === 'deletePage');

    return (
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden h-full">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">Merged Preview</h3>
                        <p className="text-sm text-gray-600">
                            {files.length} files • {allOperations.length} edit(s)
                        </p>
                    </div>
                    {allOperations.length > 0 && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Live Preview
                        </span>
                    )}
                </div>
            </div>

            <div className="p-4 bg-gray-50 h-full overflow-auto">
                <div className="space-y-4">
                    {files.map((file, index) => {
                        const fileOps = operations[file._id] || [];
                        const fileRotation = fileOps
                            .filter(op => op.type === 'rotatePage' && op.pageIndex === 0)
                            .reduce((sum, op) => sum + (op.rotation || 0), 0) % 360;
                        const isDeleted = fileOps.some(op => op.type === 'deletePage' && op.pageIndex === 0);
                        const fileWatermark = fileOps.find(op => op.type === 'addWatermark');
                        const fileTexts = fileOps.filter(op => op.type === 'addText');

                        const pdfUrl = file.fileUrl?.startsWith('http')
                            ? file.fileUrl
                            : `http://localhost:5000${file.fileUrl}`;

                        if (isDeleted) {
                            return (
                                <div key={file._id} className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="text-red-600 text-3xl">🗑️</div>
                                        <div>
                                            <h4 className="font-semibold text-red-900">
                                                {index + 1}. {file.originalFileName} - Deleted
                                            </h4>
                                            <p className="text-sm text-red-700">
                                                This file will not be included in the merge
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={file._id} className="bg-white rounded-lg shadow-xl overflow-hidden">
                                <div className="bg-gray-100 px-4 py-2 border-b flex items-center justify-between">
                                    <h4 className="font-medium text-gray-900">
                                        {index + 1}. {file.originalFileName}
                                    </h4>
                                    {fileOps.length > 0 && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            {fileOps.length} edit(s)
                                        </span>
                                    )}
                                </div>
                                <div
                                    className="relative bg-white"
                                    style={{
                                        transform: `rotate(${fileRotation}deg)`,
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <div className="relative" style={{ minHeight: '700px' }}>
                                        <iframe
                                            src={pdfUrl}
                                            className="w-full border-0"
                                            style={{ minHeight: '700px' }}
                                            title={`PDF Preview - ${file.originalFileName}`}
                                        />

                                        {/* Watermark Overlay */}
                                        {fileWatermark && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div
                                                    className="text-gray-400 font-bold text-7xl opacity-30 transform rotate-[-45deg] select-none"
                                                    style={{
                                                        textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
                                                    }}
                                                >
                                                    {fileWatermark.text}
                                                </div>
                                            </div>
                                        )}

                                        {/* Text Annotations Overlay */}
                                        {fileTexts.map((op, idx) => (
                                            <div
                                                key={idx}
                                                className="absolute pointer-events-none"
                                                style={{
                                                    left: `${op.x || 100}px`,
                                                    top: `${op.y || 100}px`,
                                                    fontSize: `${op.size || 12}px`,
                                                    color: op.color || '#000000',
                                                    fontFamily: op.fontName || 'Helvetica',
                                                    fontWeight: 'bold',
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                                                    zIndex: 10,
                                                    background: 'rgba(255,255,255,0.8)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                {op.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Operations Summary */}
                {allOperations.length > 0 && (
                    <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 sticky bottom-0">
                        <h4 className="font-semibold text-gray-900 mb-3 text-sm">Total Edits Applied:</h4>
                        <div className="flex gap-4 flex-wrap">
                            {textOperations.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {textOperations.length}
                                    </span>
                                    <span className="text-gray-700">Text</span>
                                </div>
                            )}
                            {watermarkOps.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-7 h-7 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {watermarkOps.length}
                                    </span>
                                    <span className="text-gray-700">Watermark</span>
                                </div>
                            )}
                            {rotationOps.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {rotationOps.length}
                                    </span>
                                    <span className="text-gray-700">Rotated</span>
                                </div>
                            )}
                            {deleteOps.length > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                                        {deleteOps.length}
                                    </span>
                                    <span className="text-gray-700">Deleted</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
