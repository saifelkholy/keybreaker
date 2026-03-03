require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const { getDb } = require('./database');
const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1); // Trust first key because we might be behind Cloudflare/Nginx

// Security Middleware
app.use(helmet()); // Secure HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
];

app.use(cors({
    origin: function (origin, callback) {
        // In a Dockerized unified container, we can be more permissive or 
        // rely on the fact that everything is served from the same origin.
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('.hf.space')) {
            return callback(null, true);
        }
        return callback(null, true); // Allow all for HF Space simplicity
    },
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Body limit to prevent large payload floods

// Initialize DB
getDb().catch(console.error);

// Debug Logger - Log every request
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

const checkBan = require('./middleware/banCheck');
app.use(checkBan);

const { authLimiter, apiLimiter } = require('./middleware/rateLimit');

// Global Rate Limiter (Applied to ALL routes, including 404s)
app.use(apiLimiter);

// Routes
// Apply strict limiter to auth routes (runs IN ADDITION to global)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

const path = require('path');

// ... existing routes ...

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// Handle React routing, return all requests to React app
app.get(/(.*)/, apiLimiter, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
});
