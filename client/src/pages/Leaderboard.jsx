import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


function Leaderboard() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [limit, setLimit] = useState(50);
    const navigate = useNavigate();

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get(`/api/leaderboard?search=${search}&limit=${limit}`);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [search, limit]);

    const topThree = users.slice(0, 3);
    const rest = users.slice(3);

    const handleUserClick = (username) => {
        navigate(`/${username}`);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-center">Global Ranking</h2>

            <div className="container" style={{ maxWidth: '800px', padding: 0 }}>

                {/* Podium Section */}
                {topThree.length > 0 && !search && (
                    <div className="podium-container">
                        {topThree.map((user, idx) => (
                            <div key={user.username} className={`podium-item rank-${idx + 1}`}>
                                <div className="podium-rank">
                                    <div className="podium-avatar">
                                        {user.photo ? (
                                            <img src={user.photo} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            user.username[0].toUpperCase()
                                        )}
                                    </div>
                                </div>
                                <div className="podium-bar">
                                    <div className="podium-points">{user.points}</div>
                                    <div className="podium-name">{user.username}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex flex-col md-flex-row gap-4 mb-6 items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                        {[25, 50, 100, 1000, 10000, 100000, 'all'].map((l) => (
                            <button
                                key={l}
                                onClick={() => setLimit(l)}
                                className={`btn btn-outline p-2 text-xs font-mono`}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderColor: limit === l ? 'var(--color-accent)' : 'var(--color-border)',
                                    color: limit === l ? 'var(--color-accent)' : 'inherit'
                                }}
                            >
                                {l === 'all' ? 'ALL' : l < 1000 ? `TOP ${l}` : `TOP ${l / 1000}K`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search Agent..."
                        className="input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#111', borderBottom: '1px solid #333' }}>
                            <tr>
                                <th className="p-4 text-sm text-muted font-normal">#</th>
                                <th className="p-4 text-sm text-muted font-normal">AGENT</th>
                                <th className="p-4 text-sm text-muted font-normal">RANK</th>
                                <th className="p-4 text-sm text-muted font-normal text-right">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(search ? users : rest).map((user, idx) => {
                                const realRank = search ? idx + 1 : idx + 4;
                                return (
                                    <tr key={user.username} style={{ borderBottom: '1px solid #222' }}>
                                        <td className="p-4 font-mono text-muted">{realRank.toString().padStart(2, '0')}</td>
                                        <td className="p-4 font-bold">{user.username}</td>
                                        <td className="p-4 text-sm">
                                            <span className="badge" style={{
                                                background: user.rank === 'Hash Breaker' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                color: user.rank === 'Hash Breaker' ? '#eab308' : 'inherit'
                                            }}>
                                                {user.rank}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono" style={{ color: 'var(--color-success)' }}>{user.points}</td>
                                    </tr>
                                );
                            })}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center">
                                        <div className="text-muted mb-2">No agents detected in this sector.</div>
                                        <div className="text-xs opacity-50 font-mono">WAITING FOR INTEL...</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Leaderboard;
