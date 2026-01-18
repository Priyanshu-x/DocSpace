import React from 'react';

const FilePreviewModal = ({ file, onClose }) => {
    if (!file) return null;

    const getPreviewContent = () => {
        // Use the direct Cloudinary URL (file.path) for preview
        // If your images are private/signed, you might need to proxy or generate a signature.
        // Assuming public for simplicity given "file.path" usage.

        if (file.mimeType.startsWith('image/')) {
            return (
                <img
                    src={file.path}
                    alt={file.originalName}
                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
            );
        } else if (file.mimeType.startsWith('video/')) {
            return (
                <video
                    src={file.path}
                    controls
                    autoPlay
                    style={{ maxWidth: '100%', maxHeight: '80vh' }}
                />
            );
        } else if (file.mimeType.startsWith('audio/')) {
            return (
                <audio
                    src={file.path}
                    controls
                    autoPlay
                    style={{ width: '100%' }}
                />
            );
        } else if (file.mimeType === 'application/pdf') {
            return (
                <iframe
                    src={file.path}
                    title={file.originalName}
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                />
            );
        } else {
            return (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
                    <h3>Preview not available for this file type</h3>
                    <p>{file.mimeType}</p>
                </div>
            );
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem'
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                position: 'relative',
                background: '#1a1a1a', // Dark theme background matching app
                padding: '1rem', // Minimized padding for fuller content
                borderRadius: '8px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(0,0,0,0.5)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        zIndex: 10
                    }}
                >
                    ×
                </button>

                <div style={{ marginBottom: '10px', color: '#fff', fontSize: '1.2rem', paddingRight: '30px' }}>
                    {file.originalName}
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
                    {getPreviewContent()}
                </div>

                <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                    <a
                        href={file.path}
                        download
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            display: 'inline-block',
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '0.9rem'
                        }}
                    >
                        Download Original
                    </a>
                </div>
            </div>
        </div>
    );
};

export default FilePreviewModal;
