const { getDb } = require('../database');

async function clearBans() {
    try {
        const db = await getDb();
        console.log("Clearing bans...");

        // Clear IP Bans
        await db.run('DELETE FROM banned_ips');
        console.log("- Cleared banned IPs table.");

        // Unban Users
        await db.run('UPDATE users SET is_banned = 0');
        console.log("- Reset 'is_banned' status for all users.");

        console.log("SUCCESS: All bans have been lifted.");
    } catch (e) {
        console.error("ERROR cleaning bans:", e);
    }
}

clearBans();
