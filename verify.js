async function verify() {
    const baseUrl = 'http://localhost:3000';

    // Register
    console.log('Registering user...');
    const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: `tester_${Date.now()}`, password: 'password123' })
    });

    if (regRes.ok) {
        console.log('Registration OK');
    } else {
        console.error('Registration Failed', await regRes.text());
        process.exit(1);
    }

    const regData = await regRes.json();
    const token = regData.token;

    // Get Challenges
    console.log('Fetching challenges...');
    const chalRes = await fetch(`${baseUrl}/challenges`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const challenges = await chalRes.json();
    console.log(`Fetched ${challenges.length} challenges.`);
    if (challenges.length !== 4) {
        console.error('Expected 4 challenges, got', challenges.length);
        process.exit(1);
    }

    // Check content
    console.log('Challenge 0 (Easy) Type:', challenges[0].type);
    if (challenges[0].type !== 'encoding') throw new Error('Wrong type for Easy');

    console.log('VERIFICATION SUCCESSFUL');
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
