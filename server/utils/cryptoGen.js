const crypto = require('crypto');

function getSeed() {
    // Added salt to force rotation after update
    return Math.floor(Date.now() / 3600000) + 999;
}

function getNextRotation() {
    const now = Date.now();
    const nextHour = Math.ceil(now / 3600000) * 3600000;
    return nextHour;
}

function pseudoRandom(seed) {
    let value = seed;
    return function () {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

function generateString(length, rand) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(rand() * chars.length));
    }
    return result;
}

// Cipher Implementations
function xorEncrypt(text, key) {
    let result = [];
    for (let i = 0; i < text.length; i++) {
        result.push(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return Buffer.from(result).toString('hex');
}

function caesarCipher(text, shift) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const start = (code >= 65 && code <= 90) ? 65 : 97;
            return String.fromCharCode(((code - start + shift) % 26) + start);
        }
        return char;
    }).join('');
}

function vigenereCipher(text, key) {
    let result = '';
    let keyIndex = 0;
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const start = (code >= 65 && code <= 90) ? 65 : 97;
            const shift = key[keyIndex % key.length].toLowerCase().charCodeAt(0) - 97;
            result += String.fromCharCode(((code - start + shift) % 26) + start);
            keyIndex++;
        } else {
            result += char;
        }
    }
    return result;
}

function atbashCipher(text) {
    return text.split('').map(char => {
        if (char.match(/[a-z]/i)) {
            const code = char.charCodeAt(0);
            const start = (code >= 65 && code <= 90) ? 65 : 97;
            return String.fromCharCode(start + (25 - (code - start)));
        }
        return char;
    }).join('');
}

function railFenceCipher(text, rails) {
    if (rails <= 1) return text;
    let fence = Array(rails).fill().map(() => []);
    let rail = 0;
    let dir = 1;

    for (const char of text) {
        fence[rail].push(char);
        rail += dir;
        if (rail === 0 || rail === rails - 1) dir = -dir;
    }
    return fence.flat().join('');
}

// Simple Base32 Implementation (RFC 4648)
function toBase32(text) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < text.length; i++) {
        value = (value << 8) | text.charCodeAt(i);
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31];
    }
    while (output.length % 8 !== 0) {
        output += '=';
    }
    return output;
}

function toBinary(text) {
    return text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
}

function toHex(text) {
    return Buffer.from(text).toString('hex');
}

function caesarXor(text, shift, key) {
    const caesar = caesarCipher(text, shift);
    return xorEncrypt(caesar, key);
}

// Challenge Generators
function getChallenges() {
    const seed = getSeed();
    const rand = pseudoRandom(seed);
    const challenges = [];

    const createChal = (opts) => {
        challenges.push({
            id: opts.id,
            title: opts.title,
            description: opts.description,
            points: opts.points,
            ciphertext: opts.ciphertext,
            type: opts.type,
            category: opts.category,
            hint: opts.hint,
            flag: opts.flag,
            flagPattern: opts.flagPattern || 'flag{...}'
        });
    };

    const TOTAL_CHALLENGES = 500;

    for (let i = 1; i <= TOTAL_CHALLENGES; i++) {
        const str = generateString(8, rand);
        const typeSelector = i % 10; // Distribute across 10 main variants

        if (typeSelector === 0) {
            // Base64
            const flag = `flag{b64_${str}}`;
            createChal({
                id: `chal_${i}`, title: `Base64 Module #${i}`, description: 'Intel intercepted in Base64 format. Decode it.', points: 50,
                ciphertext: Buffer.from(flag).toString('base64'), type: 'Encoding', category: 'Base64', flag
            });
        } else if (typeSelector === 1) {
            // Base32
            const flag = `flag{b32_${str}}`;
            createChal({
                id: `chal_${i}`, title: `Base32 Protocol #${i}`, description: 'Legacy Base32 encoding detected. Extract the flag.', points: 75,
                ciphertext: toBase32(flag), type: 'Encoding', category: 'Base32', flag
            });
        } else if (typeSelector === 2) {
            // MD5
            const pin = Math.floor(rand() * 10000).toString().padStart(4, '0');
            const flag = `flag{${pin}}`;
            const hash = crypto.createHash('md5').update(pin).digest('hex');
            createChal({
                id: `chal_${i}`, title: `MD5 Cracker #${i}`, description: 'Crack this 4-digit MD5 hash.', points: 150,
                ciphertext: hash, type: 'Hash', category: 'MD5', flag
            });
        } else if (typeSelector === 3) {
            // SHA-1
            const pin = Math.floor(rand() * 10000).toString().padStart(4, '0');
            const flag = `flag{${pin}}`;
            const hash = crypto.createHash('sha1').update(pin).digest('hex');
            createChal({
                id: `chal_${i}`, title: `SHA-1 Breach #${i}`, description: 'Reverse this 4-digit SHA-1 hash.', points: 200,
                ciphertext: hash, type: 'Hash', category: 'SHA-1', flag
            });
        } else if (typeSelector === 4) {
            // SHA-256
            const pin = Math.floor(rand() * 10000).toString().padStart(4, '0');
            const flag = `flag{${pin}}`;
            const hash = crypto.createHash('sha256').update(pin).digest('hex');
            createChal({
                id: `chal_${i}`, title: `SHA-256 Guard #${i}`, description: 'High-security 4-digit SHA-256 hash. Break it.', points: 300,
                ciphertext: hash, type: 'Hash', category: 'SHA-256', flag
            });
        } else if (typeSelector === 5) {
            // Factorizing
            const primes = [13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
            const p1 = primes[Math.floor(rand() * primes.length)];
            const p2 = primes[Math.floor(rand() * primes.length)];
            const flag = `flag{${Math.min(p1, p2)}_${Math.max(p1, p2)}}`;
            createChal({
                id: `chal_${i}`, title: `Factorization #${i}`, description: `Factor the number ${p1 * p2} into its two prime components. Format: flag{small_large}`, points: 100,
                ciphertext: (p1 * p2).toString(), type: 'Math', category: 'Factorization', flag
            });
        } else if (typeSelector === 6) {
            // Caesar / Substitution
            const shift = Math.floor(rand() * 25) + 1;
            const flag = `flag{shift_${str}}`;
            createChal({
                id: `chal_${i}`, title: `Caesar Shift #${i}`, description: 'A classic rotation cipher.', points: 60,
                ciphertext: caesarCipher(flag, shift), type: 'Substitution', category: 'Caesar', flag, hint: `Try shift ${shift}`
            });
        } else if (typeSelector === 7) {
            // Vigenere
            const key = generateString(4, rand);
            const flag = `flag{vig_${str}}`;
            createChal({
                id: `chal_${i}`, title: `Vigenere Protocol #${i}`, description: 'A polyalphabetic substitution cipher. Key length is 4.', points: 120,
                ciphertext: vigenereCipher(flag, key), type: 'Substitution', category: 'Vigenere', flag
            });
        } else if (typeSelector === 8) {
            // Atbash
            const flag = `flag{atb_${str}}`;
            createChal({
                id: `chal_${i}`, title: `Atbash Signal #${i}`, description: 'Mirror the alphabet to find the flag.', points: 40,
                ciphertext: atbashCipher(flag), type: 'Substitution', category: 'Atbash', flag
            });
        } else {
            // Hex / Binary / Mixed
            const flag = `flag{hex_${str}}`;
            createChal({
                id: `chal_${i}`, title: `Hex Overlay #${i}`, description: 'Raw hexadecimal stream detected.', points: 50,
                ciphertext: Buffer.from(flag).toString('hex'), type: 'Encoding', category: 'Hex', flag
            });
        }
    }

    return challenges;
}

module.exports = { getChallenges, getNextRotation };
