import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [files, setFiles] = useState([]);
    const [tab, setTab] = useState('users'); // 'users' or 'files'

    useEffect(() => {
        fetchUsers();
        fetchFiles();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFiles = async () => {
        try {
            const res = await axios.get('/api/admin/files');
            setFiles(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleBlockUser = async (user) => {
        try {
            await axios.patch(`/api/admin/users/${user.id}`, {
                isBlocked: !user.isBlocked
            });
            setUsers(users.map(u => u.id === user.id ? { ...u, isBlocked: !u.isBlocked } : u));
        } catch (error) {
            alert('Action failed');
        }
    };

    const deleteFile = async (id) => {
        if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;
        try {
            await axios.delete(`/api/files/${id}`);
            setFiles(files.filter(f => f.id !== id));
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handleDownload = async (id, originalName) => {
        try {
            const response = await axios.get(`/api/files/${id}/download`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert('Download failed');
        }
    };

    return (
        <div className="container">
            <Navbar />

            <div style={{ marginBottom: '2rem' }}>
                <Link to="/dashboard" style={{ display: 'inline-block', marginBottom: '1rem' }}>&larr; Back to Dashboard</Link>
                <div className="tabs">
                    <button
                        onClick={() => setTab('users')}
                        style={{ marginRight: '1rem', backgroundColor: tab === 'users' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'users' ? 'var(--bg-primary)' : 'var(--text-primary)' }}
                    >
                        Users
                    </button>
                    <button
                        onClick={() => setTab('files')}
                        style={{ backgroundColor: tab === 'files' ? 'var(--accent)' : 'var(--bg-tertiary)', color: tab === 'files' ? 'var(--bg-primary)' : 'var(--text-primary)' }}
                    >
                        All Files
                    </button>
                </div>
            </div>

            {tab === 'users' ? (
                <div className="card">
                    <h3>User Management</h3>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Admin</th>
                                    <th>Blocked</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.email}</td>
                                        <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                                        <td>{user.isBlocked ? 'Yes' : 'No'}</td>
                                        <td>
                                            {!user.isAdmin && (
                                                <button
                                                    onClick={() => toggleBlockUser(user)}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        backgroundColor: user.isBlocked ? 'var(--accent)' : 'var(--error)'
                                                    }}
                                                >
                                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <h3>All Files</h3>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Filename</th>
                                    <th>Owner (ID)</th>
                                    <th>Size</th>
                                    <th>Type</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map(file => (
                                    <tr key={file.id}>
                                        <td>{file.id}</td>
                                        <td>{file.originalName}</td>
                                        <td>{file.user?.email} ({file.userId})</td>
                                        <td>{file.size}</td>
                                        <td>{file.mimeType}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDownload(file.id, file.originalName)}
                                                style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}
                                            >
                                                Download
                                            </button>
                                            <button
                                                onClick={() => deleteFile(file.id)}
                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--error)' }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
