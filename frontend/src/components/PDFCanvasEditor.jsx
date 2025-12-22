import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, MousePointer2 } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function PDFCanvasEditor({ files, operations, onOperationAdd, selectedFileIndex }) {
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [scale, setScale] = useState(1.2);
    const [selectedTool, setSelectedTool] = useState('select'); // Default to Edit Mode

    // For text editing
    const [editingState, setEditingState] = useState(null);
    const [textInput, setTextInput] = useState('');

    const containerRef = useRef(null);

    const selectedFile = files[selectedFileIndex] || files[0];
    // Ensure URL is absolute
    const pdfUrl = selectedFile?.fileUrl?.startsWith('http')
        ? selectedFile.fileUrl
        : `http://localhost:5000${selectedFile?.fileUrl}`;

    // PDF Load Success
    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setCurrentPage(1);
    };

    /**
     * Intercept clicks on the Text Layer
     * When user clicks a span, we hide it and show an input on top
     */
    const handleTextLayerClick = (e) => {
        if (selectedTool !== 'select') return;

        const target = e.target;
        // Check if we clicked a text span in the text layer
        if (target.tagName === 'SPAN' && target.parentElement.className.includes('react-pdf__Page__textContent')) {
            e.stopPropagation();

            // Get position relative to the container
            const rect = target.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();

            const x = rect.left - containerRect.left + containerRef.current.scrollLeft;
            const y = rect.top - containerRect.top + containerRef.current.scrollTop;

            // Start Editing
            setEditingState({
                originalText: target.textContent,
                targetSpan: target,
                x, y,
                width: rect.width,
                height: rect.height,
                // Capture styles to match input to text
                fontSize: window.getComputedStyle(target).fontSize,
                fontFamily: window.getComputedStyle(target).fontFamily,
                color: window.getComputedStyle(target).color,
                fontWeight: window.getComputedStyle(target).fontWeight
            });
            setTextInput(target.textContent);

            // Visually hide the original text
            target.style.opacity = '0';
        }
    };

    const handleInputBlur = () => {
        if (!editingState) return;

        // If text changed, save operation
        if (textInput !== editingState.originalText) {
            const operation = {
                type: 'modifyText',
                pageIndex: currentPage - 1,
                originalText: editingState.originalText,
                newText: textInput,
                x: editingState.x,
                y: editingState.y,
                width: editingState.width,
                height: editingState.height
            };
            onOperationAdd(selectedFile._id, operation);

            // Update client-side preview immediately
            editingState.targetSpan.textContent = textInput;
        }

        // Restore visibility
        editingState.targetSpan.style.opacity = '1';
        setEditingState(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
    };

    // Zoom Controls
    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3.0));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));

    // Inject custom styles for interactivity
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .react-pdf__Page__textContent span {
                cursor: ${selectedTool === 'select' ? 'text' : 'default'} !important;
                pointer-events: ${selectedTool === 'select' ? 'auto' : 'none'};
                border-radius: 2px;
                transition: background-color 0.2s;
            }
            .react-pdf__Page__textContent span:hover {
                background-color: ${selectedTool === 'select' ? 'rgba(59, 130, 246, 0.2)' : 'transparent'};
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
            }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, [selectedTool]);

    if (!selectedFile) return (
        <div className="flex items-center justify-center h-full text-gray-500">
            No file selected
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Toolbar */}
            <div className="bg-white px-6 py-3 shadow-md border-b flex items-center justify-between z-20 relative">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedTool('select')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${selectedTool === 'select'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <MousePointer2 className="w-4 h-4" />
                        <span>Edit Text</span>
                    </button>

                    <div className="h-8 w-px bg-gray-200 mx-2"></div>

                    {/* Scale Controls */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button onClick={zoomOut} className="p-2 hover:bg-white rounded-md text-gray-600 transition-colors">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center text-sm font-semibold text-gray-700">
                            {Math.round(scale * 100)}%
                        </span>
                        <button onClick={zoomIn} className="p-2 hover:bg-white rounded-md text-gray-600 transition-colors">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="text-sm font-medium text-gray-500 bg-blue-50 px-3 py-1 rounded-full text-blue-700">
                    ✨ Click on any text to edit it
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 overflow-auto flex justify-center p-8 relative bg-gray-100" ref={containerRef}>
                <div
                    className="relative shadow-2xl transition-transform duration-200 ease-out origin-top"
                    onClick={handleTextLayerClick}
                >
                    <Document
                        file={{
                            url: pdfUrl,
                            httpHeaders: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                        }}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="bg-white"
                        loading={
                            <div className="flex items-center justify-center w-[600px] h-[800px] bg-white rounded-lg">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-4"></div>
                                    <p className="text-gray-500">Loading PDF...</p>
                                </div>
                            </div>
                        }
                    >
                        <Page
                            pageNumber={currentPage}
                            scale={scale}
                            renderAnnotationLayer={false}
                            renderTextLayer={true} // Critical for text editing
                            className="bg-white"
                        />
                    </Document>

                    {/* Floating Input for Editing */}
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
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onBlur={handleInputBlur}
                                onKeyDown={handleKeyDown}
                                className="bg-white border-2 border-blue-500 rounded px-0.5 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-200"
                                style={{
                                    fontSize: editingState.fontSize,
                                    fontFamily: editingState.fontFamily,
                                    fontWeight: editingState.fontWeight,
                                    color: editingState.color,
                                    minWidth: Math.max(editingState.width + 10, 50),
                                    height: 'auto',
                                    padding: 0,
                                    margin: -2 // slight negative margin to align perfectly
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
