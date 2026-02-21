import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// --- Interactive Tools ---

const EncodingTool = () => {
    const [input, setInput] = useState('Hello World');
    const [outputs, setOutputs] = useState({});

    useEffect(() => {
        const b64 = btoa(input);
        const hex = input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
        const bin = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        setOutputs({ b64, hex, bin });
    }, [input]);

    return (
        <div className="bg-black p-6 rounded-xl border border-white/10 mt-6 mb-8">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-accent">◈</span> Encoding Playground
            </h4>
            <div className="space-y-4">
                <div>
                    <label className="text-xs text-muted block mb-1">Plaintext Input</label>
                    <input
                        className="input w-full"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type something..."
                    />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-black p-3 rounded border border-gray-800">
                        <span className="text-[10px] text-blue-400 font-bold uppercase">Base64</span>
                        <div className="text-sm font-mono break-all mt-1">{outputs.b64}</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-gray-800">
                        <span className="text-[10px] text-green-400 font-bold uppercase">Hex</span>
                        <div className="text-sm font-mono break-all mt-1">{outputs.hex}</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-gray-800">
                        <span className="text-[10px] text-purple-400 font-bold uppercase">Binary</span>
                        <div className="text-sm font-mono break-all mt-1">{outputs.bin}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CaesarTool = () => {
    const [text, setText] = useState('CRYPTO');
    const [shift, setShift] = useState(3);
    const [result, setResult] = useState('');

    useEffect(() => {
        const cipher = (str, s) => {
            return str.split('').map(char => {
                if (char.match(/[a-z]/i)) {
                    const code = char.charCodeAt(0);
                    const start = (code >= 65 && code <= 90) ? 65 : 97;
                    return String.fromCharCode(((code - start + s) % 26) + start);
                }
                return char;
            }).join('');
        };
        setResult(cipher(text, parseInt(shift)));
    }, [text, shift]);

    return (
        <div className="bg-black p-6 rounded-xl border border-white/10 mt-6 mb-8">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-accent">◈</span> Caesar Shift Calculator
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-muted block mb-1">Text to Encrypt</label>
                        <input className="input w-full" value={text} onChange={(e) => setText(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-muted flex justify-between mb-1">
                            Shift: <span>{shift}</span>
                        </label>
                        <input
                            type="range" min="1" max="25" className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent"
                            value={shift} onChange={(e) => setShift(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex flex-col justify-center bg-black border border-accent/20 p-4 rounded-lg">
                    <span className="text-[10px] text-accent font-bold uppercase mb-2">Resulting Ciphertext</span>
                    <div className="text-2xl font-mono text-white tracking-widest break-all">
                        {result}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Content Sections ---

const IntroSection = () => (
    <div className="space-y-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to KeyBreaker</h2>
        <p className="text-muted leading-relaxed">
            Cryptography is the practice and study of techniques for secure communication in the presence of adversarial behavior.
            More generally, cryptography is about constructing and analyzing protocols that prevent third parties or the public from
            reading private messages.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
            <div className="card border-l-4 border-l-accent bg-black">
                <h3 className="text-lg font-bold mb-2">Encryption vs Encoding</h3>
                <p className="text-sm">Encryption uses a secret key to hide data. Encoding just changes the format and requires no key.</p>
            </div>
            <div className="card border-l-4 border-l-success bg-black">
                <h3 className="text-lg font-bold mb-2">The Goal</h3>
                <p className="text-sm">In CTFs, you are often tasked with identifying the cipher type and finding the key to extract the "Flag".</p>
            </div>
        </div>
    </div>
);

const EncodingsSection = () => (
    <div className="space-y-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">Data Representation & Encodings</h2>
        <p className="text-muted">Encodings are NOT encryption. They are public standards for data representation.</p>

        <div className="grid gap-4">
            <div className="bg-black p-4 rounded border border-gray-800">
                <h3 className="text-lg font-bold text-blue-400 mb-2">Base64</h3>
                <p className="text-sm">The most common binary-to-text encoding. Used in email attachments, data URIs, and JWTs.</p>
                <code className="text-accent text-xs block mt-2 bg-black p-2">chars: A-Z, a-z, 0-9, +, / (padding =)</code>
            </div>
            <div className="bg-black p-4 rounded border border-gray-800">
                <h3 className="text-lg font-bold text-green-400 mb-2">Hexadecimal (Base16)</h3>
                <p className="text-sm">Represents bytes using 0-9 and a-f. Very common in file headers and memory analysis.</p>
                <code className="text-accent text-xs block mt-2 bg-black p-2">chars: 0-9, A-F</code>
            </div>
        </div>

        <EncodingTool />
    </div>
);

const CiphersSection = () => (
    <div className="space-y-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">Classical Substitution Ciphers</h2>
        <p className="text-muted">These ciphers replace symbols with other symbols based on a system or key.</p>

        <div className="space-y-4">
            <div className="bg-black p-5 rounded border border-gray-800">
                <h3 className="text-xl font-bold text-accent mb-2">Caesar Cipher</h3>
                <p className="text-sm mb-3">Invented by Julius Caesar. Each letter is replaced by a letter some fixed number of positions down the alphabet.</p>
                <CaesarTool />
            </div>
            <div className="bg-black p-5 rounded border border-gray-800">
                <h3 className="text-xl font-bold text-success mb-2">Vigenére Cipher</h3>
                <p className="text-sm">A polyalphabetic substitution cipher. It uses a keyword to determine a series of different Caesar shifts for each letter.</p>
                <div className="bg-black/50 p-4 rounded mt-3 text-xs font-mono">
                    Plaintext: ATTACKATDAWN <br />
                    Key: LEMON <br />
                    Result: LXFOPVEFRNHR
                </div>
            </div>
            <div className="bg-black p-5 rounded border border-gray-800">
                <h3 className="text-xl font-bold text-blue-400 mb-2">Atbash Cipher</h3>
                <p className="text-sm">A simple alphabet mirror. A=Z, B=Y, etc. It doesn't actually have a key besides the alphabet itself.</p>
            </div>
        </div>
    </div>
);

const ModernSection = () => (
    <div className="space-y-6 animate-fadeIn">
        <h2 className="text-3xl font-bold text-white mb-2">Modern Cryptography</h2>

        <div className="grid gap-6">
            <div className="bg-black p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-purple-400 mb-4">The Power of XOR</h3>
                <p className="text-sm mb-4">The Exclusive OR (XOR) operation is the foundation of almost all modern ciphers. It has the magical property: <code className="text-accent">A ⊕ B = C</code> implies <code className="text-accent">C ⊕ B = A</code>.</p>
            </div>

            <div className="bg-black p-6 rounded-xl border border-white/5">
                <h3 className="text-xl font-bold text-error mb-4">One-Way Hashing</h3>
                <p className="text-sm mb-4">Hashing turns data into a fixed-length string (fingerprint). It is mathematically impossible to reverse.</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-black p-3 rounded border border-gray-800">
                        <div className="text-xs font-bold text-muted mb-1 uppercase">MD5 (Insecure)</div>
                        <div className="text-[10px] break-all">d41d8cd98f00b204e9800998ecf8427e</div>
                    </div>
                    <div className="bg-black p-3 rounded border border-gray-800">
                        <div className="text-xs font-bold text-muted mb-1 uppercase">SHA-256 (Standard)</div>
                        <div className="text-[10px] break-all">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- Main Page ---

function Learn() {
    const [activeTab, setActiveTab] = useState('intro');

    const themes = {
        intro: 'var(--color-primary)',
        encodings: 'var(--color-accent)',
        ciphers: 'var(--color-success)',
        modern: 'var(--color-error)',
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col md:flex-row gap-8">

                {/* Fixed Sidebar */}
                <aside className="md:w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                        <h3 className="text-xs font-bold text-muted uppercase tracking-widest px-4 mb-4">Curriculum</h3>
                        {[
                            { id: 'intro', label: '01. Introduction' },
                            { id: 'encodings', label: '02. Encodings' },
                            { id: 'ciphers', label: '03. Classic Ciphers' },
                            { id: 'modern', label: '04. Modern Crypto' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 border bg-black ${activeTab === tab.id
                                    ? `border-success text-success font-bold shadow-lg shadow-success/10`
                                    : 'border-white/10 text-muted hover:border-success/50 hover:text-white'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${activeTab === tab.id ? `bg-success` : 'bg-gray-700'}`}></span>
                                {tab.label}
                            </button>
                        ))}

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <Link to="/" className="btn w-full !bg-black !text-success border border-success hover:bg-success/5 shadow-lg shadow-success/10">
                                BACK TO DASHBOARD
                            </Link>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-grow min-h-[600px] card overflow-visible p-8 md:p-12 relative !bg-black">
                    {/* Background Glow */}
                    <div
                        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] opacity-10 pointer-events-none transition-all duration-700"
                        style={{ background: themes[activeTab] }}
                    ></div>

                    {activeTab === 'intro' && <IntroSection />}
                    {activeTab === 'encodings' && <EncodingsSection />}
                    {activeTab === 'ciphers' && <CiphersSection />}
                    {activeTab === 'modern' && <ModernSection />}
                </main>

            </div>
        </div>
    );
}

export default Learn;
