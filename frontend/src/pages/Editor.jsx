import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { HexColorPicker } from 'react-colorful';
import { fileAPI, editorAPI } from '../services/api';
import {
    ArrowLeft,
    Type,
    Image as ImageIcon,
    RotateCw,
    Trash2,
    Download,
    Save,
    Droplet,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    Loader
} from 'lucide-react';

<<<<<<< HEAD
// Set up PDF.js worker - use local file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
=======
// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d

export default function Editor() {
    const { fileId } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [file, setFile] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Editor state
<<<<<<< HEAD
    const [activeTool, setActiveTool] = useState('select'); // Default to select mode
=======
    const [activeTool, setActiveTool] = useState(null);
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d
    const [operations, setOperations] = useState([]);
    const [textInput, setTextInput] = useState('');
    const [textColor, setTextColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(12);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [watermarkText, setWatermarkText] = useState('');

<<<<<<< HEAD
    // Text editing state
    const [editingState, setEditingState] = useState(null);
    const [editInput, setEditInput] = useState('');

=======
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d
    useEffect(() => {
        loadFile();
    }, [fileId]);

    const loadFile = async () => {
        try {
            const response = await fileAPI.getOne(fileId);
            if (response.success) {
                setFile(response.data.file);
            }
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Failed to load file');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleCanvasClick = (e) => {
<<<<<<< HEAD
        if (!activeTool || activeTool === 'select') return;
=======
        if (!activeTool) return;
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = rect.height - (e.clientY - rect.top); // PDF coords are bottom-up

        if (activeTool === 'text' && textInput) {
            const operation = {
                type: 'addText',
                pageIndex: currentPage - 1,
                text: textInput,
                x,
                y,
                size: fontSize,
                color: textColor,
                fontName: 'Helvetica'
            };
            setOperations([...operations, operation]);
            setTextInput('');
        }
    };

<<<<<<< HEAD
    // Handle clicking on existing text to edit it
    useEffect(() => {
        if (activeTool !== 'select') return;

        const handleTextClick = (e) => {
            const target = e.target;
            if (target.tagName === 'SPAN' && target.parentElement.className.includes('react-pdf__Page__textContent')) {
                e.stopPropagation();

                const rect = target.getBoundingClientRect();
                const containerRect = document.querySelector('.react-pdf__Page').getBoundingClientRect();

                const x = rect.left - containerRect.left;
                const y = rect.top - containerRect.top;

                setEditingState({
                    originalText: target.textContent,
                    targetSpan: target,
                    x, y,
                    width: rect.width,
                    height: rect.height,
                    fontSize: window.getComputedStyle(target).fontSize,
                    fontFamily: window.getComputedStyle(target).fontFamily,
                    color: window.getComputedStyle(target).color
                });
                setEditInput(target.textContent);
                target.style.opacity = '0';
            }
        };

        document.addEventListener('click', handleTextClick);
        return () => document.removeEventListener('click', handleTextClick);
    }, [activeTool]);

    // Inject CSS for text hover effects
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .react-pdf__Page__textContent span {
                cursor: ${activeTool === 'select' ? 'text' : 'default'} !important;
                pointer-events: ${activeTool === 'select' ? 'auto' : 'none'};
                border-radius: 2px;
                transition: background-color 0.2s;
            }
            .react-pdf__Page__textContent span:hover {
                background-color: ${activeTool === 'select' ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
                box-shadow: ${activeTool === 'select' ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none'};
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, [activeTool]);

    const handleEditSave = () => {
        if (!editingState) return;

        if (editInput !== editingState.originalText) {
            const operation = {
                type: 'modifyText',
                pageIndex: currentPage - 1,
                originalText: editingState.originalText,
                newText: editInput,
                x: editingState.x,
                y: editingState.y
            };
            setOperations([...operations, operation]);
            editingState.targetSpan.textContent = editInput;
        }

        editingState.targetSpan.style.opacity = '1';
        setEditingState(null);
    };

    const handleEditKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            editingState.targetSpan.style.opacity = '1';
            setEditingState(null);
        }
    };

=======
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d
    const addWatermark = () => {
        if (!watermarkText) {
            alert('Please enter watermark text');
            return;
        }

        const operation = {
            type: 'addWatermark',
            text: watermarkText,
            opacity: 0.3
        };
        setOperations([...operations, operation]);
        setWatermarkText('');
        setActiveTool(null);
    };

    const rotatePage = () => {
        const operation = {
            type: 'rotatePage',
            pageIndex: currentPage - 1,
            rotation: 90
        };
        setOperations([...operations, operation]);
    };

    const deletePage = () => {
        if (numPages <= 1) {
            alert('Cannot delete the only page');
            return;
        }

        if (!confirm(`Delete page ${currentPage}?`)) return;

        const operation = {
            type: 'deletePage',
            pageIndex: currentPage - 1
        };
        setOperations([...operations, operation]);

        // Move to previous page if deleting last page
        if (currentPage === numPages) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleSave = async () => {
        if (operations.length === 0) {
            alert('No changes to save');
            return;
        }

        setSaving(true);
        try {
            const response = await editorAPI.modify(fileId, operations);

            if (response.success) {
                alert('PDF saved successfully!');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error saving PDF:', error);
            alert('Failed to save PDF');
        } finally {
            setSaving(false);
        }
    };

    const handleUndo = () => {
        if (operations.length > 0) {
            setOperations(operations.slice(0, -1));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">
                        {file?.originalFileName}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleUndo}
                        disabled={operations.length === 0}
                        className="btn btn-secondary disabled:opacity-50"
                    >
                        Undo ({operations.length})
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || operations.length === 0}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <>
                                <Loader className="w-4 h-4 spinner" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Toolbar */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                    <h2 className="font-bold text-gray-900 mb-4">Editing Tools</h2>

<<<<<<< HEAD
                    {/* Select Tool - For editing existing text */}
                    <div className="mb-6">
                        <button
                            onClick={() => setActiveTool('select')}
                            className={`btn w-full justify-start ${activeTool === 'select' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                            Select & Edit Text
                        </button>
                        {activeTool === 'select' && (
                            <p className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                ✨ Click on any text in the PDF to edit it
                            </p>
                        )}
                    </div>

=======
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d
                    {/* Text Tool */}
                    <div className="mb-6">
                        <button
                            onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
                            className={`btn w-full justify-start ${activeTool === 'text' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            <Type className="w-4 h-4" />
                            Add Text
                        </button>

                        {activeTool === 'text' && (
                            <div className="mt-3 space-y-2">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Enter text..."
                                    className="input text-sm"
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                                        min="8"
                                        max="72"
                                        className="input text-sm w-20"
                                    />
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                            className="w-10 h-10 rounded border-2 border-gray-300"
                                            style={{ backgroundColor: textColor }}
                                        />
                                        {showColorPicker && (
                                            <div className="absolute z-10 mt-2">
                                                <div
                                                    className="fixed inset-0"
                                                    onClick={() => setShowColorPicker(false)}
                                                />
                                                <HexColorPicker color={textColor} onChange={setTextColor} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600">Click on PDF to place text</p>
                            </div>
                        )}
                    </div>

                    {/* Watermark Tool */}
                    <div className="mb-6">
                        <button
                            onClick={() => setActiveTool(activeTool === 'watermark' ? null : 'watermark')}
                            className={`btn w-full justify-start ${activeTool === 'watermark' ? 'btn-primary' : 'btn-secondary'
                                }`}
                        >
                            <Droplet className="w-4 h-4" />
                            Add Watermark
                        </button>

                        {activeTool === 'watermark' && (
                            <div className="mt-3 space-y-2">
                                <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    placeholder="Watermark text..."
                                    className="input text-sm"
                                />
                                <button
                                    onClick={addWatermark}
                                    className="btn btn-primary w-full text-sm"
                                >
                                    Apply to All Pages
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Page Operations */}
                    <div className="space-y-2">
                        <button
                            onClick={rotatePage}
                            className="btn btn-secondary w-full justify-start"
                        >
                            <RotateCw className="w-4 h-4" />
                            Rotate Page
                        </button>

                        <button
                            onClick={deletePage}
                            className="btn btn-danger w-full justify-start"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Page
                        </button>
                    </div>

                    {/* Operations Log */}
                    {operations.length > 0 && (
                        <div className="mt-6">
                            <h3 className="font-semibold text-sm text-gray-700 mb-2">
                                Changes ({operations.length})
                            </h3>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {operations.map((op, idx) => (
                                    <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                                        {op.type === 'addText' && `Text: "${op.text}"`}
<<<<<<< HEAD
                                        {op.type === 'modifyText' && `Edit: "${op.originalText}" → "${op.newText}"`}
=======
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d
                                        {op.type === 'addWatermark' && `Watermark: "${op.text}"`}
                                        {op.type === 'rotatePage' && `Rotate page ${op.pageIndex + 1}`}
                                        {op.type === 'deletePage' && `Delete page ${op.pageIndex + 1}`}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* PDF Viewer */}
                <div className="flex-1 flex flex-col bg-gray-100">
                    {/* Controls */}
                    <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage <= 1}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium">
                                Page {currentPage} of {numPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                                disabled={currentPage >= numPages}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                className="btn btn-secondary"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium w-16 text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={() => setScale(Math.min(2.0, scale + 0.1))}
                                className="btn btn-secondary"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* PDF Canvas */}
                    <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
                        <div
                            onClick={handleCanvasClick}
                            className={`shadow-lg ${activeTool ? 'cursor-crosshair' : 'cursor-default'}`}
                        >
                            <Document
                                file={file?.fileUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex items-center justify-center p-12">
                                        <div className="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={currentPage}
                                    scale={scale}
<<<<<<< HEAD
                                    renderTextLayer={activeTool === 'select'}
                                    renderAnnotationLayer={false}
                                />
                            </Document>

                            {/* Floating Input for Editing Text */}
                            {editingState && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: editingState.x,
                                        top: editingState.y,
                                        zIndex: 100
                                    }}
                                >
                                    <input
                                        autoFocus
                                        value={editInput}
                                        onChange={(e) => setEditInput(e.target.value)}
                                        onBlur={handleEditSave}
                                        onKeyDown={handleEditKeyDown}
                                        className="bg-white border-2 border-blue-500 rounded px-1 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        style={{
                                            fontSize: editingState.fontSize,
                                            fontFamily: editingState.fontFamily,
                                            color: editingState.color,
                                            minWidth: Math.max(editingState.width + 10, 50),
                                            height: 'auto',
                                            padding: 0,
                                            margin: -2
                                        }}
                                    />
                                </div>
                            )}
=======
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
>>>>>>> 723318478853dec92fd5478583a8be25ad8fd84d
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
