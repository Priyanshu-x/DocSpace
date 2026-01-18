import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const PublicShare = () => {
    const { token } = useParams();
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShareConfig = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/share/${token}`);
                setFile(res.data);
            } catch (err) {
                if (err.response?.status === 410) {
                    setError('This link has expired.');
                } else if (err.response?.status === 404) {
                    setError('File not found or link invalid.');
                } else {
                    setError('Failed to load shared file.');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchShareConfig();
    }, [token]);

    const handleDownload = () => {
        if (!file || !file.downloadUrl) return;
        const link = document.createElement('a');
        link.href = file.downloadUrl;
        link.setAttribute('download', file.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: 'white' }}>
            Loading...
        </div>
    );

    if (error) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: 'white' }}>
            <h2>⚠️ {error}</h2>
        </div>
    );

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#121212',
            color: 'white',
            padding: '2rem'
        }}>
            <div style={{
                background: '#1e1e1e',
                padding: '3rem',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                maxWidth: '500px',
                width: '100%'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                    {file.mimeType.startsWith('image/') ? '🖼️' :
                        file.mimeType.startsWith('video/') ? '🎥' :
                            file.mimeType.startsWith('audio/') ? '🎵' :
                                file.mimeType === 'application/pdf' ? '📄' : '📁'}
                </div>
                <h1 style={{ marginBottom: '0.5rem', wordBreak: 'break-all' }}>{file.filename}</h1>
                <p style={{ color: '#aaa', marginBottom: '2rem' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.createdAt).toLocaleDateString()}
                </p>

                {file.mimeType.startsWith('image/') && (
                    <div style={{ marginBottom: '2rem' }}>
                        <img src={file.downloadUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                    </div>
                )}

                <button
                    onClick={handleDownload}
                    style={{
                        background: 'var(--primary, #007bff)',
                        color: 'white',
                        border: 'none',
                        padding: '1rem 2rem',
                        fontSize: '1.2rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: 'bold'
                    }}
                >
                    Download File
                </button>
            </div>
        </div>
    );
};

export default PublicShare;
