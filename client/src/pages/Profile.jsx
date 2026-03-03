import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const isValidUrl = (url) => {
    if (!url) return false;
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch (e) {
        return false;
    }
};


function Profile() {
    const navigate = useNavigate();
    const { username } = useParams(); // Get username from URL
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false); // Track if viewing own profile
    const [formData, setFormData] = useState({
        bio: '',
        photo: '',
        gender: 'Male',
        contact_type: 'Email',
        contact_value: ''
    });
    const [stats, setStats] = useState({ solvedCount: 0, points: 0, rank: '', username: '', badges: [] });
    const [message, setMessage] = useState('');

    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [username]); // Refetch when username URL param changes

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setNotFound(false); // Reset not found state
            let res;
            if (username) {
                // Fetch public profile by username
                res = await axios.get(`/api/auth/user/${username}`);
                setIsOwner(false);
            } else {
                // Fetch own profile
                res = await axios.get('/api/auth/me');
                setIsOwner(true);
            }

            const u = res.data;
            setStats({ solvedCount: u.solvedCount, points: u.points, rank: u.rank, username: u.username, badges: u.badges || [] });
            setFormData({
                bio: u.bio || '',
                photo: u.photo || '',
                gender: u.gender || 'Male',
                contact_type: u.contact_type || 'Email',
                contact_value: u.contact_value || ''
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (username) {
                // User not found -> Show 404
                setNotFound(true);
                setLoading(false);
            } else {
                navigate('/login');
            }
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/auth/profile', formData);
            setMessage('Profile Updated Successfully');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Error updating profile');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you strictly sure? This action is IRREVERSIBLE. Your account and all progress will be wiped.')) return;
        try {
            await axios.delete('/api/auth/account');
            localStorage.clear();
            navigate('/login');
        } catch (err) {
            alert('Failed to delete account');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Profile...</div>;

    if (notFound) {
        return (
            <div className="container flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h1 className="text-9xl font-bold text-white mb-4" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>404</h1>
                <h2 className="text-4xl text-white tracking-widest uppercase">User Not Found</h2>
                <div className="mt-8 text-gray-500 font-mono">The agent you are looking for does not exist in our database.</div>
                <button onClick={() => navigate('/leaderboard')} className="mt-8 btn">
                    Return to Leaderboard
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h2 className="text-3xl font-bold mb-6 text-center">{isOwner ? 'My Profile' : 'Agent Profile'}</h2>

            {/* Stats Card */}
            <div className="card flex items-center gap-6 mb-8">
                <div
                    style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: '#222', border: '2px solid var(--color-accent)',
                        backgroundImage: isValidUrl(formData.photo) ? `url(${formData.photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}
                >
                    {(!formData.photo || !isValidUrl(formData.photo)) && <span className="text-2xl font-bold">{stats.username?.[0]?.toUpperCase()}</span>}
                </div>
                <div className="flex-grow">
                    <h3 className="text-2xl font-bold">{stats.username}</h3>
                    <div className="flex gap-4 mt-2 text-sm">
                        <span className="badge badge-blue">{stats.rank}</span>
                    </div>
                    {formData.bio && <p className="mt-3 text-muted italic">"{formData.bio}"</p>}

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
                        <div className="text-center">
                            <div className="text-xs text-muted uppercase mb-1">Total Points</div>
                            <div className="text-2xl font-bold text-success">{stats.points}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xs text-muted uppercase mb-1">Challenges Solved</div>
                            <div className="text-2xl font-bold text-accent">{stats.solvedCount}</div>
                        </div>
                    </div>

                    {!isOwner && (
                        <div className="mt-4 text-sm text-muted">
                            <span className="font-bold text-gray-500">{formData.contact_type}: </span>
                            {formData.contact_value || 'Hidden'}
                        </div>
                    )}
                </div>
            </div>

            {/* Awards section */}
            <div className="card mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-accent">◈</span> Achievement Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                    {stats.badges.length > 0 ? (
                        stats.badges.map((badge, idx) => (
                            <div key={idx} className="badge-achievement" title={`Awarded on ${new Date(badge.granted_at).toLocaleDateString()}`}>
                                {badge.badge_name}
                            </div>
                        ))
                    ) : (
                        <div className="text-muted text-sm italic">No badges earned yet. Complete challenges to unlock awards.</div>
                    )}
                </div>
            </div>

            {isOwner && (
                <div className="grid md-grid-cols-1 gap-8">
                    {/* Edit Form */}
                    <div className="card">
                        <h3 className="text-xl font-bold mb-4">Edit Identity</h3>
                        {message && <div className="mb-4 text-green-500 font-mono">{message}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm text-muted mb-2">Photo URL</label>
                                <input name="photo" value={formData.photo} onChange={handleChange} className="input" placeholder="https://..." />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm text-muted mb-2">Description / Bio</label>
                                <textarea name="bio" value={formData.bio} onChange={handleChange} className="input" rows="3" placeholder="Tell us about your skills..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-muted mb-2">Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange} className="input">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-2">Contact Method</label>
                                    <select name="contact_type" value={formData.contact_type} onChange={handleChange} className="input">
                                        <option value="Email">Email</option>
                                        <option value="Phone">Phone</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm text-muted mb-2">{formData.contact_type} Address</label>
                                <input
                                    name="contact_value"
                                    value={formData.contact_value}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder={formData.contact_type === 'Email' ? 'agent@example.com' : '+1 234 567 890'}
                                />
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-800">
                                <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-400 text-sm font-bold border border-red-900 bg-red-900/20 px-4 py-2 rounded">
                                    DELETE ACCOUNT
                                </button>
                                <button type="submit" className="btn">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;
