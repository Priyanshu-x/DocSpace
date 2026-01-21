import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const Navbar = ({ onSearch }) => {
    const { user, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const location = useLocation();

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <img src="/logo.png" alt="DocSpace Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                    <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>DocSpace</span>
                </Link>
                <div className="breadcrumbs" style={{ marginLeft: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Home {location.pathname !== '/dashboard' ? ` / ${location.pathname.slice(1)}` : ''}
                </div>
            </div>

            <div className="nav-controls">
                {onSearch && (
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search files..."
                            onChange={(e) => onSearch(e.target.value)}
                            style={{ margin: 0, padding: '0.5rem', width: '250px' }}
                            aria-label="Search files"
                        />
                    </div>
                )}

                <div className="user-menu" style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-primary)' }}
                        aria-label="User menu"
                        aria-expanded={showMenu}
                    >
                        <div style={{ width: '32px', height: '32px', backgroundColor: user?.isGuest ? 'var(--warning)' : 'var(--bg-tertiary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: user?.isGuest ? '#000' : 'inherit' }}>
                            {user?.isGuest ? 'G' : user?.email[0].toUpperCase()}
                        </div>
                        <span className="dropdown-arrow">▼</span>
                    </button>

                    {showMenu && (
                        <div className="dropdown-menu" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            minWidth: '200px',
                            zIndex: 1000
                        }}>
                            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {user?.isGuest ? 'Guest Account (Temporary)' : user?.email}
                            </div>

                            {user?.isGuest ? (
                                <>
                                    <Link to="/login" style={{ display: 'block', padding: '0.75rem', color: 'var(--primary)', textDecoration: 'none' }}>Log In</Link>
                                    <Link to="/register" style={{ display: 'block', padding: '0.75rem', color: 'var(--accent)', textDecoration: 'none' }}>Register to Save</Link>
                                </>
                            ) : (
                                user?.isAdmin && (
                                    <Link to="/admin" style={{ display: 'block', padding: '0.75rem', color: 'var(--text-primary)', textDecoration: 'none' }}>Admin Panel</Link>
                                )
                            )}

                            <button
                                onClick={logout}
                                style={{ width: '100%', textAlign: 'left', background: 'transparent', padding: '0.75rem', color: 'var(--error)' }}
                            >
                                {user?.isGuest ? 'Exit Guest Mode' : 'Logout'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
