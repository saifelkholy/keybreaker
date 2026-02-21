import { useState } from 'react';
import axios from 'axios';

function ChallengeCard({ challenge, onSolve }) {
    const [flag, setFlag] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/challenges/submit',
                { challengeId: challenge.id, flag },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess(`+${res.data.pointsAdded} pts`);
            onSolve();
        } catch (err) {
            setError(err.response?.data?.error || 'Incorrect Flag');
        }
    };

    return (
        <div className={`card flex flex-col ${challenge.solved ? 'opacity-50' : ''}`} style={{ borderColor: challenge.solved ? 'var(--color-success)' : '' }}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex gap-2 mb-2">
                        <span className="badge badge-blue">{challenge.category}</span>
                        <span className="badge font-mono" style={{ borderColor: '#444' }}>{challenge.type}</span>
                    </div>
                    <h3 className="text-xl">{challenge.title}</h3>
                </div>
                <div className="font-mono font-bold text-lg">{challenge.points}pts</div>
            </div>

            <p className="text-muted mb-2 flex-grow text-sm" style={{ lineHeight: '1.6' }}>{challenge.description}</p>

            <div className="text-xs font-mono mb-4 text-accent opacity-80">
                Flag Pattern: <span className="text-white">{challenge.flagPattern || 'flag{...}'}</span>
            </div>

            {challenge.ciphertext && (
                <div className="font-mono text-xs p-2 mb-4 break-all" style={{ background: '#111', borderRadius: '4px', border: '1px solid #222' }}>
                    {challenge.ciphertext}
                </div>
            )}

            {challenge.solved ? (
                <div className="text-center font-bold" style={{ color: 'var(--color-success)' }}>
                    SOLVED
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="mt-auto">
                    <input
                        type="text"
                        className="input mb-2 text-sm"
                        placeholder={challenge.flagPattern || "flag{...}"}
                        value={flag}
                        onChange={(e) => setFlag(e.target.value)}
                    />
                    {error && <div className="text-sm mb-2" style={{ color: 'var(--color-error)' }}>{error}</div>}
                    {success && <div className="text-sm mb-2" style={{ color: 'var(--color-success)' }}>{success}</div>}
                    <button type="submit" className="btn w-full text-sm">
                        Submit Flag
                    </button>
                </form>
            )}
        </div>
    );
}

export default ChallengeCard;
