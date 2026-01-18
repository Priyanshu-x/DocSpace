import { useState } from 'react';
import { getFileIcon } from '../utils/fileIcons';

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const FileExplorer = ({ files, folders = [], selectedIds, onToggleSelect, onSelectAll, onDelete, onDownload, onFolderClick, onDeleteFolder, onPreview, onShare }) => {
    const [view, setView] = useState('grid'); // 'grid' | 'list'
    const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, name-asc, size-desc

    const sortedFiles = [...files].sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'name-asc') return a.originalName.localeCompare(b.originalName);
        if (sortBy === 'size-desc') return b.size - a.size;
        return 0;
    });

    return (
        <div className="file-explorer">
            <div className="explorer-controls">
                <div className="control-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={files.length > 0 && selectedIds.length === files.length}
                            onChange={(e) => onSelectAll(e.target.checked)}
                        />
                        <span style={{ marginLeft: '0.5rem' }}>Select All</span>
                    </label>
                </div>

                <div className="control-group">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="size-desc">Size (Largest)</option>
                    </select>

                    <div className="view-toggle">
                        <button
                            className={view === 'grid' ? 'active' : ''}
                            onClick={() => setView('grid')}
                            title="Grid View"
                            aria-label="Grid View"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </button>
                        <button
                            className={view === 'list' ? 'active' : ''}
                            onClick={() => setView('list')}
                            title="List View"
                            aria-label="List View"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            </div>

            {files.length === 0 && folders.length === 0 ? (
                <div className="empty-state">No files or folders found.</div>
            ) : (
                <div className={`file-content ${view}`}>
                    {folders.map(folder => (
                        <div
                            key={`folder-${folder.id}`}
                            className="file-item folder-item"
                            onClick={() => onFolderClick(folder.id)}
                            style={{ cursor: 'pointer', backgroundColor: 'var(--bg-secondary)' }}
                        >
                            <div className="file-preview">
                                <span style={{ fontSize: '2rem' }}>📁</span>
                            </div>
                            <div className="file-details">
                                <div className="file-name">{folder.name}</div>
                                <div className="file-meta">Folder</div>
                            </div>
                            <div className="file-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => onDeleteFolder(folder.id)}
                                    className="btn-danger-icon"
                                    title="Delete Folder"
                                    aria-label={`Delete ${folder.name}`}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                    {sortedFiles.map(file => {
                        const isSelected = selectedIds.includes(file.id);
                        return (
                            <div
                                key={file.id}
                                className={`file-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onPreview && onPreview(file)}
                            >
                                <div className="file-checkbox" onClick={(e) => { e.stopPropagation(); onToggleSelect(file.id); }}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleSelect(file.id)}
                                        aria-label={`Select ${file.originalName}`}
                                    />
                                </div>
                                <div className="file-preview">
                                    {getFileIcon(file.mimeType, file.originalName)}
                                </div>
                                <div className="file-details">
                                    <div className="file-name" title={file.originalName}>{file.originalName}</div>
                                    <div className="file-meta">
                                        <span>{formatBytes(file.size)}</span>
                                        <span className="separator">•</span>
                                        <span>{formatDate(file.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="file-actions" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => onDownload(file.id, file.originalName)} title="Download" aria-label={`Download ${file.originalName}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    </button>
                                    <button onClick={() => onShare(file)} title="Share" aria-label={`Share ${file.originalName}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                                    </button>
                                    <button
                                        onClick={() => onDelete(file.id)}
                                        className="btn-danger-icon"
                                        title="Delete"
                                        aria-label={`Delete ${file.originalName}`}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default FileExplorer;
