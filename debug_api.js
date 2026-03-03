const axios = require('axios');

async function check() {
    try {
        // 1. Register/Login to get token
        const base = 'http://localhost:3000';
        let token;
        try {
            const res = await axios.post(`${base}/auth/login`, { username: 'testuser', password: 'password' });
            token = res.data.token;
        } catch (e) {
            // Create if fails
            const res = await axios.post(`${base}/auth/register`, { username: 'testuser', password: 'password' });
            token = res.data.token;
        }

        // 2. Get Challenges
        const chalRes = await axios.get(`${base}/challenges`, { headers: { Authorization: `Bearer ${token}` } });
        console.log('Status:', chalRes.status);
        console.log('Data Type:', typeof chalRes.data);
        console.log('Is Array?', Array.isArray(chalRes.data));
        console.log('Keys:', Object.keys(chalRes.data));

        if (chalRes.data.challenges) {
            console.log('Challenges Array Length:', chalRes.data.challenges.length);
        } else {
            console.log('WARNING: chalRes.data.challenges is undefined!');
        }

    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

check();
