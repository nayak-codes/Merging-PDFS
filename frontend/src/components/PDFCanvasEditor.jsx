import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
    ZoomIn, ZoomOut, MousePointer2, ChevronLeft, ChevronRight, Maximize2,
    Type, Highlighter, Pencil, Square, Circle, Image as ImageIcon,
    Minus, ArrowRight, Eraser, Download, Palette, X
} from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function PDFCanvasEditor({ files, operations, onOperationAdd, selectedFileIndex }) {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [selectedTool, setSelectedTool] = useState('select');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawings, setDrawings] = useState([]);
    const [currentPath, setCurrentPath] = useState([]);
    const [drawColor, setDrawColor] = useState('#FF0000');
    const [drawWidth, setDrawWidth] = useState(3);
    const [showColorPicker, setShowColorPicker] = useState(false);

    // Text state
    const [textColor, setTextColor] = useState('#000000');
    const [fontSize, setFontSize] = useState(16);
    const [editingState, setEditingState] = useState(null);
    const [textInput, setTextInput] = useState('');

    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const pdfContainerRef = useRef(null);

    const selectedFile = files[selectedFileIndex] || files[0];
    const [pdfBlob, setPdfBlob] = useState(null);

    // Load PDF as blob
    useEffect(() => {
        const loadPDF = async () => {
            if (!selectedFile?.fileUrl) {
                setPdfBlob(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const url = selectedFile.fileUrl.startsWith('http')
                    ? selectedFile.fileUrl
                    : `http://localhost:5000${selectedFile.fileUrl}`;

                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                setPdfBlob(blobUrl);
            } catch (err) {
                console.error('PDF Load Error:', err);
                setError(`Failed to load PDF: ${err.message}`);
                setLoading(false);
            }
        };

        loadPDF();

        return () => {
            if (pdfBlob) {
                URL.revokeObjectURL(pdfBlob);
            }
        };
    }, [selectedFile]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setCurrentPage(1);
        setLoading(false);
        setError(null);
    };

    const onDocumentLoadError = (error) => {
        console.error('PDF.js Load Error:', error);
        setError(`PDF rendering failed: ${error.message || 'Unknown error'}`);
        setLoading(false);
    };

    // Handle text layer clicks for editing
    useEffect(() => {
        if (selectedTool !== 'select') return;

        const handleTextClick = (e) => {
            const target = e.target;
            if (target.tagName === 'SPAN' && target.closest('.react-pdf__Page__textContent')) {
                e.stopPropagation();

                const rect = target.getBoundingClientRect();
                const containerRect = pdfContainerRef.current?.getBoundingClientRect();

                if (!containerRect) return;

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
                    color: window.getComputedStyle(target).color,
                    fontWeight: window.getComputedStyle(target).fontWeight
                });
                setTextInput(target.textContent);
                target.style.opacity = '0';
            }
        };

        document.addEventListener('click', handleTextClick);
        return () => document.removeEventListener('click', handleTextClick);
    }, [selectedTool]);

    // Drawing handlers
    const getMousePos = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        if (selectedTool === 'select' || selectedTool === 'text') return;

        const pos = getMousePos(e);
        setIsDrawing(true);
        setCurrentPath([pos]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || selectedTool === 'select' || selectedTool === 'text') return;

        const pos = getMousePos(e);
        setCurrentPath(prev => [...prev, pos]);

        // Draw on canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (selectedTool === 'highlight') {
            ctx.globalAlpha = 0.3;
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (currentPath.length > 1) {
            const lastPos = currentPath[currentPath.length - 2];
            ctx.beginPath();
            ctx.moveTo(lastPos.x, lastPos.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;

        setIsDrawing(false);

        if (currentPath.length > 0) {
            const newDrawing = {
                type: selectedTool,
                points: currentPath,
                color: drawColor,
                width: drawWidth,
                pageIndex: currentPage - 1
            };
            setDrawings(prev => [...prev, newDrawing]);

            // Save operation
            const operation = {
                type: 'addDrawing',
                pageIndex: currentPage - 1,
                drawing: newDrawing
            };
            onOperationAdd(selectedFile._id, operation);
        }

        setCurrentPath([]);
    };

    // Handle canvas click for shapes and text
    const handleCanvasClick = (e) => {
        if (selectedTool === 'select' || selectedTool === 'draw' || selectedTool === 'highlight' || selectedTool === 'eraser') return;

        const pos = getMousePos(e);

        if (selectedTool === 'text') {
            const newText = prompt('Enter text:');
            if (newText) {
                const operation = {
                    type: 'addText',
                    pageIndex: currentPage - 1,
                    text: newText,
                    x: pos.x,
                    y: pos.y,
                    fontSize,
                    color: textColor
                };
                onOperationAdd(selectedFile._id, operation);
            }
        } else if (selectedTool === 'rectangle') {
            const operation = {
                type: 'addRectangle',
                pageIndex: currentPage - 1,
                x: pos.x,
                y: pos.y,
                width: 100,
                height: 60,
                strokeColor: drawColor,
                strokeWidth: drawWidth
            };
            onOperationAdd(selectedFile._id, operation);
        } else if (selectedTool === 'circle') {
            const operation = {
                type: 'addCircle',
                pageIndex: currentPage - 1,
                x: pos.x,
                y: pos.y,
                radius: 40,
                strokeColor: drawColor,
                strokeWidth: drawWidth
            };
            onOperationAdd(selectedFile._id, operation);
        }
    };

    const handleInputBlur = () => {
        if (!editingState) return;

        if (textInput !== editingState.originalText) {
            const operation = {
                type: 'modifyText',
                pageIndex: currentPage - 1,
                originalText: editingState.originalText,
                newText: textInput
            };
            onOperationAdd(selectedFile._id, operation);
            editingState.targetSpan.textContent = textInput;
        }

        editingState.targetSpan.style.opacity = '1';
        setEditingState(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        } else if (e.key === 'Escape') {
            if (editingState) {
                editingState.targetSpan.style.opacity = '1';
                setEditingState(null);
            }
        }
    };

    // Zoom Controls
    const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
    const resetZoom = () => setScale(1.0);

    // Page Navigation
    const goToPrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(numPages, prev + 1));

    // Inject hover styles
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .react-pdf__Page__textContent span {
                cursor: ${selectedTool === 'select' ? 'text' : 'default'} !important;
                pointer-events: ${selectedTool === 'select' ? 'auto' : 'none'};
                border-radius: 2px;
                transition: all 0.2s ease;
            }
            .react-pdf__Page__textContent span:hover {
                background-color: ${selectedTool === 'select' ? 'rgba(59, 130, 246, 0.15)' : 'transparent'};
                box-shadow: ${selectedTool === 'select' ? '0 0 0 2px rgba(59, 130, 246, 0.4)' : 'none'};
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, [selectedTool]);

    // Update canvas size when PDF loads
    useEffect(() => {
        if (canvasRef.current && pdfContainerRef.current) {
            const pdfElement = pdfContainerRef.current.querySelector('.react-pdf__Page');
            if (pdfElement) {
                const rect = pdfElement.getBoundingClientRect();
                canvasRef.current.width = rect.width;
                canvasRef.current.height = rect.height;
            }
        }
    }, [pdfBlob, scale, currentPage]);

    const tools = [
        { id: 'select', icon: MousePointer2, label: 'Select', color: 'blue' },
        { id: 'text', icon: Type, label: 'Text', color: 'purple' },
        { id: 'draw', icon: Pencil, label: 'Draw', color: 'green' },
        { id: 'highlight', icon: Highlighter, label: 'Highlight', color: 'yellow' },
        { id: 'eraser', icon: Eraser, label: 'Eraser', color: 'red' },
        { id: 'rectangle', icon: Square, label: 'Rectangle', color: 'indigo' },
        { id: 'circle', icon: Circle, label: 'Circle', color: 'pink' },
        { id: 'line', icon: Minus, label: 'Line', color: 'cyan' },
        { id: 'arrow', icon: ArrowRight, label: 'Arrow', color: 'orange' },
        { id: 'image', icon: ImageIcon, label: 'Image', color: 'teal' },
    ];

    const colorPresets = [
        '#000000', '#FF0000', '#00FF00', '#0000FF',
        '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF',
        '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
    ];

    if (!selectedFile) {
        return (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="text-center p-12 bg-white rounded-3xl shadow-2xl">
                    <div className="text-8xl mb-6">📄</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">No File Selected</h3>
                    <p className="text-gray-600">Select a file from the sidebar to start editing</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Professional Toolbar */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-2xl">
                {/* Top Toolbar - Main Tools */}
                <div className="px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Tools */}
                        <div className="flex items-center gap-3">
                            {tools.map((tool) => (
                                <button
                                    key={tool.id}
                                    onClick={() => setSelectedTool(tool.id)}
                                    className={`group relative px-4 py-3 rounded-2xl flex flex-col items-center gap-2 transition-all duration-300 transform hover:scale-110 ${selectedTool === tool.id
                                            ? `bg-gradient-to-br from-${tool.color}-500 to-${tool.color}-600 text-white shadow-2xl shadow-${tool.color}-300 scale-110`
                                            : 'bg-gray-50 text-gray-700 hover:bg-white hover:shadow-xl'
                                        }`}
                                    title={tool.label}
                                >
                                    <tool.icon className={`w-6 h-6 ${selectedTool === tool.id ? 'animate-pulse' : ''}`} />
                                    <span className="text-xs font-bold">{tool.label}</span>
                                    {selectedTool === tool.id && (
                                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4">
                            {/* Zoom */}
                            <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-2 gap-2 shadow-lg">
                                <button onClick={zoomOut} className="p-3 hover:bg-white rounded-xl transition-all hover:scale-110" title="Zoom Out">
                                    <ZoomOut className="w-5 h-5 text-gray-700" />
                                </button>
                                <span className="w-20 text-center text-sm font-bold text-gray-800 bg-white px-3 py-2 rounded-lg">
                                    {Math.round(scale * 100)}%
                                </span>
                                <button onClick={zoomIn} className="p-3 hover:bg-white rounded-xl transition-all hover:scale-110" title="Zoom In">
                                    <ZoomIn className="w-5 h-5 text-gray-700" />
                                </button>
                                <button onClick={resetZoom} className="p-3 hover:bg-white rounded-xl transition-all hover:scale-110" title="Reset">
                                    <Maximize2 className="w-5 h-5 text-gray-700" />
                                </button>
                            </div>

                            {/* Page Navigation */}
                            {numPages > 1 && (
                                <div className="flex items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-2 gap-2 shadow-lg">
                                    <button onClick={goToPrevPage} disabled={currentPage <= 1} className="p-3 hover:bg-white rounded-xl transition-all disabled:opacity-30 hover:scale-110">
                                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                                    </button>
                                    <span className="px-4 py-2 text-sm font-bold text-gray-800 bg-white rounded-lg">
                                        {currentPage} / {numPages}
                                    </span>
                                    <button onClick={goToNextPage} disabled={currentPage >= numPages} className="p-3 hover:bg-white rounded-xl transition-all disabled:opacity-30 hover:scale-110">
                                        <ChevronRight className="w-5 h-5 text-gray-700" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Toolbar - Tool Options */}
                {(selectedTool === 'draw' || selectedTool === 'highlight' || selectedTool === 'rectangle' || selectedTool === 'circle') && (
                    <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200/50">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-700">Width:</label>
                                <input
                                    type="range"
                                    value={drawWidth}
                                    onChange={(e) => setDrawWidth(parseInt(e.target.value))}
                                    min="1"
                                    max="20"
                                    className="w-40 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="text-sm font-bold text-gray-800 bg-white px-3 py-1 rounded-lg min-w-[50px] text-center">{drawWidth}px</span>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowColorPicker(!showColorPicker)}
                                    className="w-12 h-12 rounded-xl border-4 border-white shadow-xl hover:scale-110 transition-transform"
                                    style={{ backgroundColor: drawColor }}
                                    title="Choose Color"
                                />
                                {showColorPicker && (
                                    <div className="absolute top-full mt-3 z-50 bg-white p-4 rounded-2xl shadow-2xl border-2 border-gray-200 animate-scale">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-bold text-gray-700">Choose Color</span>
                                            <button onClick={() => setShowColorPicker(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 w-56">
                                            {colorPresets.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => { setDrawColor(color); setShowColorPicker(false); }}
                                                    className="w-12 h-12 rounded-xl border-2 border-gray-300 hover:scale-110 transition-transform shadow-lg"
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PDF Canvas */}
            <div className="flex-1 overflow-auto flex justify-center items-start p-8 relative" ref={containerRef}>
                {error ? (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-12 text-center max-w-md shadow-2xl">
                        <div className="text-7xl mb-6">⚠️</div>
                        <h3 className="text-2xl font-bold text-red-900 mb-3">Failed to Load PDF</h3>
                        <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                    </div>
                ) : (
                    <div className="relative" ref={pdfContainerRef}>
                        <Document
                            file={pdfBlob}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div className="flex flex-col items-center justify-center w-[700px] h-[900px] bg-white rounded-3xl shadow-2xl border-2 border-gray-200">
                                    <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                                    <p className="text-gray-600 text-lg font-semibold">Loading PDF...</p>
                                </div>
                            }
                            className="shadow-2xl rounded-2xl overflow-hidden"
                        >
                            <Page
                                pageNumber={currentPage}
                                scale={scale}
                                renderAnnotationLayer={false}
                                renderTextLayer={selectedTool === 'select'}
                                className="bg-white rounded-2xl"
                            />
                        </Document>

                        {/* Drawing Canvas Overlay */}
                        <canvas
                            ref={canvasRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            onClick={handleCanvasClick}
                            className="absolute top-0 left-0 pointer-events-auto"
                            style={{
                                cursor: selectedTool === 'select' ? 'default' : 'crosshair',
                                pointerEvents: selectedTool === 'select' ? 'none' : 'auto'
                            }}
                        />

                        {/* Floating Edit Input */}
                        {editingState && (
                            <div style={{ position: 'absolute', left: editingState.x, top: editingState.y, zIndex: 1000 }}>
                                <input
                                    autoFocus
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onBlur={handleInputBlur}
                                    onKeyDown={handleKeyDown}
                                    className="bg-white border-2 border-blue-500 rounded-lg px-2 shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-600"
                                    style={{
                                        fontSize: editingState.fontSize,
                                        fontFamily: editingState.fontFamily,
                                        fontWeight: editingState.fontWeight,
                                        color: editingState.color,
                                        minWidth: Math.max(editingState.width + 20, 60),
                                        height: 'auto',
                                        padding: '4px 8px'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Tool Hint */}
                {selectedTool !== 'select' && !error && (
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-8 py-4 rounded-full shadow-2xl animate-slide-up">
                        <p className="text-sm font-bold flex items-center gap-2">
                            {selectedTool === 'text' && '📝 Click anywhere on the PDF to add text'}
                            {selectedTool === 'draw' && '🖊️ Click and drag to draw freehand'}
                            {selectedTool === 'highlight' && '🖍️ Click and drag to highlight'}
                            {selectedTool === 'eraser' && '🧹 Click to erase drawings'}
                            {selectedTool === 'rectangle' && '⬜ Click to add a rectangle'}
                            {selectedTool === 'circle' && '⭕ Click to add a circle'}
                            {selectedTool === 'line' && '➖ Click to draw a line'}
                            {selectedTool === 'arrow' && '➡️ Click to draw an arrow'}
                            {selectedTool === 'image' && '🖼️ Click to insert an image'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
