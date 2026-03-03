import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/auth/login', { username, password });
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="flex justify-center items-center" style={{ minHeight: '80vh' }}>
            <div className="card" style={{ width: '400px' }}>
                <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>
                {error && <div className="mb-4 p-2 text-sm bg-red-900/20 text-red-500 rounded border border-red-900">{error}</div>}
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block mb-2 text-sm text-muted">Username</label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter Username"
                            maxLength={20}
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm text-muted">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                        />
                    </div>
                    <button type="submit" className="btn w-full mb-4">
                        Sign In
                    </button>
                    <div className="text-center text-sm text-muted">
                        New here? <Link to="/register" style={{ color: 'var(--color-accent)' }}>Create an account</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;
