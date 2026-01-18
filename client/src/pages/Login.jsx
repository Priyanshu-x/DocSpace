import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../App';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, guestLogin } = useAuth(); // Destructure guestLogin
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success('Login successful');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        }
    };

    const handleGuestLogin = async () => {
        try {
            await guestLogin();
            toast.success('Continued as Guest');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Guest login failed');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>
            <div className="card" style={{ width: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Login</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" style={{ width: '100%' }}>Login</button>
                </form>
                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
                </div>

                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', textAlign: 'center' }}>
                    <button
                        type="button"
                        onClick={handleGuestLogin}
                        style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
