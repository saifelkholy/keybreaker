import React, { useEffect } from 'react';

function Ads() {
    return (
        <div className="container p-8 animate-fade-in">
            <div className="card border-primary p-6 mb-8 text-center bg-darker">
                <h1 className="text-4xl font-bold mb-4 metal-text glow">ADS & SPONSORSHIPS</h1>
                <p className="text-muted mb-6">Support the KeyBreaker platform by viewing our sponsors.</p>

                <div className="grid grid-cols-1 gap-8 max-w-4xl mx-auto">
                    {/* Placeholder for actual AdSense Unit */}
                    <div className="ad-container border-dashed border-2 border-primary-30 p-4 min-h-[300px] flex items-center justify-center bg-black/50 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(var(--color-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                        {/* AdSense Unit Placeholder */}
                        <ins className="adsbygoogle"
                            style={{ display: 'block' }}
                            data-ad-client="ca-pub-2204784984199544"
                            data-ad-slot="YOUR_AD_SLOT_HERE"
                            data-ad-format="auto"
                            data-full-width-responsive="true"></ins>

                        <div className="text-primary-50 text-sm font-mono z-10">
                            [ ADVERTISEMENT SPACE ]
                        </div>
                    </div>

                    <div className="card p-6 border-accent bg-dark/40">
                        <h2 className="text-xl font-bold mb-3 text-accent">Why see ads?</h2>
                        <p className="text-sm">
                            Hosting a high-performance CTF platform with live challenge generation and secure sandboxes requires significant server resources.
                            Ads help us keep the platform free for all basic users while we continue to develop new cryptographic challenges and security puzzles.
                        </p>
                    </div>
                </div>
            </div>

            <div className="text-center text-xs text-muted-dark opacity-50">
                Partnered with Google AdSense &copy; 2026 KeyBreaker
            </div>
        </div>
    );
}

export default Ads;
