import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container flex justify-between items-center" style={{ padding: '0 2rem' }}>
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-xl font-bold" style={{ letterSpacing: '-1px' }}>
                        KEYBREAKER
                    </Link>
                </div>
                <div className="flex gap-4 text-sm font-medium">
                    {token ? (
                        <>
                            <Link to="/" className="hover:text-white">Challenges</Link>
                            <Link to="/learn" className="hover:text-white">Learn</Link>
                            <Link to="/leaderboard" className="hover:text-white">Leaderboard</Link>
                            <Link to="/profile" className="hover:text-white">Profile</Link>
                            <button onClick={logout} className="text-muted hover:text-white" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Log In</Link>
                            <Link to="/register" className="btn" style={{ padding: '0.5rem 1rem' }}>Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
