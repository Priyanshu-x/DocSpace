import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FilePreviewModal from '../components/FilePreviewModal';

import { useAuth } from '../App';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import UploadZone from '../components/UploadZone';
import FileExplorer from '../components/FileExplorer';

// Utility to format bytes
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [previewFile, setPreviewFile] = useState(null);
    const { user } = useAuth();

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('createdAt');
    const [order, setOrder] = useState('desc');

    const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
    const [breadcrumbs, setBreadcrumbs] = useState([]); // Array of {id, name}
    const [folders, setFolders] = useState([]);

    const fetchFolders = async () => {
        try {
            const res = await axios.get('/api/folders', {
                params: { parentId: currentFolderId }
            });
            setFolders(res.data);
        } catch (error) {
            console.error('Failed to fetch folders');
        }
    };

    const fetchFolderDetails = async (id) => {
        if (!id) {
            setBreadcrumbs([]);
            return;
        }
        try {
            const res = await axios.get(`/api/folders/${id}`);
            setBreadcrumbs([{ id: null, name: 'Home' }, { id: res.data.id, name: res.data.name }]);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchFiles = async () => {
        try {
            const res = await axios.get('/api/files', {
                params: {
                    page,
                    limit: 20,
                    sortBy,
                    order,
                    search: searchTerm,
                    folderId: currentFolderId || 'root'
                }
            });
            setFiles(res.data.data);
            setFilteredFiles(res.data.data);
            setTotalPages(res.data.meta.totalPages);
        } catch (error) {
            console.error('Failed to fetch files', error);
            toast.error('Failed to load files');
        }
    };

    useEffect(() => {
        setPage(1);
        fetchFolders();
        fetchFiles();
        fetchFolderDetails(currentFolderId);
    }, [currentFolderId, sortBy, order, searchTerm]);

    useEffect(() => {
        fetchFiles();
    }, [page]);

    // Debounce search could be added here to avoid too many requests
    // For now, client-side filtering is removed in favor of server-side


    const handleUpload = async (selectedFiles) => {
        if (!selectedFiles || selectedFiles.length === 0) return;

        if (selectedFiles.length > 20) {
            toast.error('Max 20 files allowed at a time');
            return;
        }

        const formData = new FormData();
        Array.from(selectedFiles).forEach(file => {
            formData.append('files', file);
        });
        if (currentFolderId) {
            formData.append('folderId', currentFolderId);
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });
            fetchFiles();
            setUploadProgress(100);
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 1000);
            toast.success('Upload complete');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Upload failed');
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this file?')) return;
        try {
            await axios.delete(`/api/files/${id}`);
            const newFiles = files.filter(f => f.id !== id);
            setFiles(newFiles);
            setSelectedIds(selectedIds.filter(sid => sid !== id)); // Remove from selection
            // filteredFiles updates automatically via effect? No, only if files changes. 
            // Effect depends on [searchTerm, files], so updating files triggers it.
            toast.success('File deleted');
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    const handleDeleteFolder = async (id) => {
        if (!confirm('Are you sure you want to delete this folder and ALL its contents?')) return;
        try {
            await axios.delete(`/api/folders/${id}`);
            const newFolders = folders.filter(f => f.id !== id);
            setFolders(newFolders);
            toast.success('Folder deleted');
        } catch (error) {
            toast.error('Delete folder failed');
        }
    };

    const handleShare = async (file) => {
        try {
            const res = await axios.post(`/api/files/${file.id}/share`);
            const { link } = res.data;
            await navigator.clipboard.writeText(link);
            toast.success('Share link copied to clipboard!');
        } catch (error) {
            toast.error('Failed to create share link');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} files?`)) return;

        // This could be improved with a backend bulk delete endpoint, but loop works for now.
        // We'll process them in sequence or parallel.
        try {
            await Promise.all(selectedIds.map(id => axios.delete(`/api/files/${id}`)));
            const newFiles = files.filter(f => !selectedIds.includes(f.id));
            setFiles(newFiles);
            toast.success('Files deleted');
        } catch (error) {
            toast.error('Some files could not be deleted');
            fetchFiles(); // Refresh to match server state
        }
    };

    const handleDownload = async (id, originalName) => {
        // Direct navigation to download endpoint which handles auth via cookie and redirects/streams
        // Using window.open or setting window.location is better for large files than Blob
        try {
            // We can't just use window.open if we need to pass headers, but cookies are sent automatically.
            // However, for error handling traverse, we might check first?
            // Simplest for large files: create a temporary link and click it, pointing directly to API.
            // The API endpoint /api/files/:id/download redirects to Cloudinary or streams file.
            const downloadUrl = `${axios.defaults.baseURL}/api/files/${id}/download`;

            // We can use a hidden iframe or just a link click.
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', originalName); // Hint to browser
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error('Download failed');
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const selectAll = (checked) => {
        if (checked) {
            setSelectedIds(filteredFiles.map(f => f.id));
        } else {
            setSelectedIds([]);
        }
    };

    return (
        <div className="container">
            <Navbar onSearch={setSearchTerm} />

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Upload Files</h3>
                    <button onClick={async () => {
                        const name = prompt('Folder Name:');
                        if (name) {
                            try {
                                await axios.post('/api/folders', { name, parentId: currentFolderId });
                                fetchFolders();
                                toast.success('Folder created');
                            } catch (e) { toast.error('Failed to create folder'); }
                        }
                    }}>+ New Folder</button>
                </div>
                {/* Breadcrumbs */}
                <div className="breadcrumbs" style={{ marginTop: '10px', marginBottom: '10px', color: '#aaa' }}>
                    <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentFolderId(null)}>Home</span>
                    {currentFolderId && <span> / Current Folder</span>}
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Max 20 files, each up to 5GB.
                </p>
                <UploadZone onFilesSelected={handleUpload} disabled={uploading} />

                {uploading && (
                    <div className="upload-progress">
                        <div className="progress-item">
                            <div className="progress-info">
                                <div className="progress-name">Uploading {files.length} files...</div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="progress-status">{uploadProgress}%</div>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>My Files</h3>
                {selectedIds.length > 0 && (
                    <div className="bulk-actions" style={{ marginBottom: 0 }}>
                        <span style={{ marginRight: '1rem', fontWeight: 'bold' }}>{selectedIds.length} Selected</span>
                        <button onClick={handleBulkDelete} style={{ backgroundColor: 'var(--error)', padding: '0.5rem 1rem' }}>
                            Delete Selected
                        </button>
                    </div>
                )}
            </div>

            <FileExplorer
                files={filteredFiles}
                folders={folders}
                onFolderClick={(id) => setCurrentFolderId(id)}
                onDeleteFolder={handleDeleteFolder}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onPreview={(file) => setPreviewFile(file)}
                onShare={handleShare}
            />
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        Next
                    </button>
                </div>
            )}
            {previewFile && (
                <FilePreviewModal
                    file={previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </div>
    );
};

export default Dashboard;
