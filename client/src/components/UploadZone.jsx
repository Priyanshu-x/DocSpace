import { useState, useRef } from 'react';

const UploadZone = ({ onFilesSelected, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            onFilesSelected(files);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(e.target.files);
        }
    };

    return (
        <div
            className={`upload-zone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                style={{ display: 'none' }}
                disabled={disabled}
            />

            <div className="upload-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
            </div>

            <h3>Drag & Drop files here</h3>
            <p>or click to browse</p>

            <div className="upload-constraints">
                <div className="constraint-item">
                    <span>Max 20 files</span>
                </div>
                <div className="constraint-item">
                    <span>Up to 5GB each</span>
                </div>
                <div className="constraint-item">
                    <span>All formats supported</span>
                </div>
            </div>
        </div>
    );
};

export default UploadZone;
