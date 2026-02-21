const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Load .env manually
try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split(/\r?\n/).forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["'](.*)["']$/, '$1'); // Remove quotes
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
        console.log('Loaded configuration from .env');
    }
} catch (e) {
    console.log('Could not load .env file:', e.message);
}

// Configuration
const SERVER_DIR = path.join(__dirname, '../server');
const CLIENT_DIR = path.join(__dirname, '../client');
const API_PORT = 3000;
const FRONTEND_PORT = 5173;

function log(prefix, data) {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
        if (line.trim()) console.log(`[${prefix}] ${line.trim()}`);
    });
}

async function startBackend() {
    console.log('Starting Backend...');
    const backend = spawn('node', ['index.js'], { cwd: SERVER_DIR, shell: true });
    backend.stdout.on('data', d => log('SERVER', d));
    backend.stderr.on('data', d => log('SERVER ERR', d));
    return backend;
}

function waitForBackend(port = 3000, maxAttempts = 30) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        console.log(`Waiting for backend to be ready on port ${port}...`);
        const interval = setInterval(() => {
            attempts++;
            const req = http.get(`http://127.0.0.1:${port}/api/leaderboard`, (res) => {
                clearInterval(interval);
                console.log('Backend is ready!');
                resolve();
            });
            req.on('error', () => {
                if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    reject(new Error(`Backend did not start within ${maxAttempts}s`));
                }
            });
            req.end();
        }, 1000);
    });
}

async function startNgrok() {
    console.log('Starting Ngrok...');

    // Static domain for ngrok
    const staticDomain = process.env.NGROK_DOMAIN || 'unfilamentous-wallace-unsincerely.ngrok-free.dev';
    const args = ['http', FRONTEND_PORT.toString()];

    console.log(`Using static domain: ${staticDomain}`);
    args.push(`--domain=${staticDomain}`);

    // Start ngrok in the background
    const tunnel = spawn('ngrok', args, { shell: true });

    tunnel.stdout.on('data', d => log('NGROK', d));
    tunnel.stderr.on('data', d => log('NGROK', d));

    // Give ngrok a moment to initialize
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 20; // 20 seconds timeout

        const checkTunnel = setInterval(async () => {
            attempts++;
            try {
                // Fetch the tunnel URL from the local ngrok API
                const url = await getNgrokUrl();
                clearInterval(checkTunnel);
                resolve({ process: tunnel, url });
            } catch (err) {
                if (attempts >= maxAttempts) {
                    clearInterval(checkTunnel);
                    reject(new Error(`Ngrok failed to initialize after ${maxAttempts}s. Check logs above.`));
                }
            }
        }, 1000);
    });
}

function getNgrokUrl() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.tunnels && parsed.tunnels.length > 0) {
                        resolve(parsed.tunnels[0].public_url);
                    } else {
                        reject(new Error('No tunnels found'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
    });
}

async function startFrontend(allowedHost) {
    console.log(`Starting Frontend with Allowed Host: ${allowedHost}...`);

    // Extract domain from URL (e.g., https://foo.ngrok-free.app -> foo.ngrok-free.app)
    const domain = allowedHost.replace(/^https?:\/\//, '');

    const frontend = spawn('npm', ['run', 'dev'], {
        cwd: CLIENT_DIR,
        shell: true,
        env: { ...process.env, VITE_ALLOWED_HOST: domain }
    });

    frontend.stdout.on('data', d => log('CLIENT', d));
    frontend.stderr.on('data', d => log('CLIENT ERR', d));
    return frontend;
}

async function main() {
    try {
        const backend = await startBackend();

        // Wait for backend to be actually listening before proceeding
        await waitForBackend();

        let publicUrl = 'http://localhost:5173';
        let ngrokProcess = null;

        try {
            const ngrokInfo = await startNgrok();
            ngrokProcess = ngrokInfo.process;
            publicUrl = ngrokInfo.url;
            console.log('\n==================================================');
            console.log(` PUBLIC URL: ${publicUrl}`);
            console.log('==================================================\n');
        } catch (err) {
            console.error('Failed to start Ngrok (is it installed?):', err.message);
            console.log('Continuing with localhost only...');
        }

        const frontend = await startFrontend(publicUrl);

    } catch (err) {
        console.error('Startup Error:', err);
    }
}

main();
