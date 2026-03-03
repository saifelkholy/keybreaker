import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ChallengeCard from '../components/ChallengeCard';

function Dashboard() {
    const [challenges, setChallenges] = useState([]);
    const [user, setUser] = useState(null);
    const [nextRotation, setNextRotation] = useState(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        try {
            setError(null);
            const [chalRes, userRes] = await Promise.all([
                axios.get('/api/challenges'),
                axios.get('/api/auth/me')
            ]);

            let chalData = [];
            if (Array.isArray(chalRes.data)) {
                chalData = chalRes.data;
            } else if (chalRes.data && Array.isArray(chalRes.data.challenges)) {
                chalData = chalRes.data.challenges;
                setNextRotation(chalRes.data.nextRotation);
            }

            setChallenges(chalData || []);
            setUser(userRes.data);
        } catch (err) {
            console.error("Dashboard Error:", err);
            setError(err.response?.data?.error || err.message || 'Failed to load data');
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('isLoggedIn');
                navigate('/login');
            }
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            if (!nextRotation) return;
            const now = Date.now();
            const diff = nextRotation - now;
            if (diff <= 0) {
                setTimeLeft('ROTATING...');
                fetchData();
                return;
            }
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [nextRotation]);

    const safeChallenges = Array.isArray(challenges) ? challenges : [];
    const categories = ['All', 'Caesar', 'Vigenere', 'Atbash', 'Base64', 'Base32', 'Hex', 'MD5', 'SHA-1', 'SHA-256', 'Factorization'];

    const filteredChallenges = safeChallenges.filter(c => {
        const title = c.title || '';
        const type = c.type || '';
        const cat = c.category || 'General';
        return (title.toLowerCase().includes(search.toLowerCase()) || type.toLowerCase().includes(search.toLowerCase())) &&
            (categoryFilter === 'All' || cat === categoryFilter);
    });

    return (
        <div>
            {/* Error Message */}
            {error && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-6 text-center">
                    <strong>Error:</strong> {error}
                    <button onClick={fetchData} className="ml-4 underline hover:text-white">Retry</button>
                </div>
            )}

            {/* HUD Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="card text-center">
                    <div className="text-sm text-muted mb-1">Status</div>
                    <div className="text-2xl font-bold text-green-500">CONNECTED</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm text-muted mb-1">Rank</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{user?.rank || 'Recruit'}</div>
                </div>
                <div className="card text-center">
                    <div className="text-sm text-muted mb-1">Score</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--color-success)' }}>{user?.points || 0}</div>
                </div>
            </div>

            {/* Prominent Timer */}
            <div className="card mb-8 text-center" style={{ border: '1px solid var(--color-accent)', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0, 112, 243, 0.05) 100%)' }}>
                <div className="text-sm text-muted uppercase tracking-widest mb-2">Next Systems Rotation</div>
                <div className="text-6xl font-mono font-bold" style={{ color: 'var(--color-text-main)', letterSpacing: '2px' }}>
                    {timeLeft || '--:--'}
                </div>
                <div className="text-xs text-muted mt-2">New challenges generated every hour</div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-4">
                <h2 className="text-2xl mb-1 flex items-center gap-2">
                    Challenges <span className="badge badge-green" style={{ fontSize: '0.8rem' }}>{filteredChallenges.length} Active</span>
                </h2>
                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="input"
                        style={{ width: '150px' }}
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input
                        type="text"
                        className="input flex-grow md:w-[250px]"
                        placeholder="Search challenges..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredChallenges.map(chal => (
                    <ChallengeCard key={chal.id} challenge={chal} onSolve={fetchData} />
                ))}
                {filteredChallenges.length === 0 && !error && (
                    <div className="text-center text-muted py-10 w-full" style={{ gridColumn: '1/-1' }}>
                        No challenges found. Try adjusting filters.
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
