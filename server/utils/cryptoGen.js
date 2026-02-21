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

    // Generate 55 Challenges loop (25 original + 30 new)
    for (let i = 1; i <= 55; i++) {
        const str = generateString(8, rand);
        const randVal = Math.floor(rand() * 100);

        if (i <= 15) { // 1-15: Encodings (Added Base32, More Base64)
            const type = i % 5;
            if (type === 0) {
                const flag = `flag{b64_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Base64 #${i}`, description: 'Decode this Base64.', points: 50,
                    ciphertext: Buffer.from(flag).toString('base64'), type: 'Encoding', category: 'General', flag, flagPattern: 'flag{...}'
                });
            } else if (type === 1) {
                const flag = `flag{hex_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Hex #${i}`, description: 'Decode this Hex.', points: 50,
                    ciphertext: toHex(flag), type: 'Encoding', category: 'General', flag, flagPattern: 'flag{...}'
                });
            } else if (type === 2) {
                const flag = `flag{rev_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Reverse #${i}`, description: 'Reverse the string.', points: 50,
                    ciphertext: flag.split('').reverse().join(''), type: 'Encoding', category: 'General', flag, flagPattern: 'flag{...}'
                });
            } else if (type === 3) {
                const flag = `flag{b32_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Base32 #${i}`, description: 'Decode this Base32.', points: 75,
                    ciphertext: toBase32(flag), type: 'Encoding', category: 'General', flag, flagPattern: 'flag{...}'
                });
            } else {
                const flag = `flag{bin_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Binary #${i}`, description: 'Binary string.', points: 75,
                    ciphertext: toBinary(flag), type: 'Encoding', category: 'General', flag, flagPattern: 'flag{...}'
                });
            }
        }
        else if (i <= 25) { // 16-25: Easy Crypto
            const shift = Math.floor(rand() * 25) + 1;
            if (i % 2 === 0) {
                const flag = `flag{rot_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Caesar Shift`, description: `Decrypt.`, points: 75,
                    ciphertext: caesarCipher(flag, shift), type: 'Substitution', category: 'Crypto', flag, hint: `Shift ~${shift}`, flagPattern: 'flag{...}'
                });
            } else {
                const flag = `flag{atb_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Atbash`, description: 'Alphabet mirror.', points: 75,
                    ciphertext: atbashCipher(flag), type: 'Substitution', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            }
        }
        else if (i <= 35) { // 26-35: Medium Crypto (XOR, Vigenere, Rail, CaesarXOR)
            const key = generateString(6, rand);
            const mode = i % 4;
            if (mode === 0) {
                const flag = `flag{xor_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `XOR Ops`, description: `Key: ${key}`, points: 100,
                    ciphertext: xorEncrypt(flag, key), type: 'XOR', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            } else if (mode === 1) {
                const vKey = generateString(4, rand).toLowerCase();
                const flag = `flag{vig_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Vigenère`, description: `Key: ${vKey}`, points: 150,
                    ciphertext: vigenereCipher(flag, vKey), type: 'Substitution', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            } else if (mode === 2) {
                const rails = Math.floor(rand() * 2) + 2;
                const flag = `flag{rail_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Rail Fence`, description: `${rails} Rails.`, points: 125,
                    ciphertext: railFenceCipher(flag, rails), type: 'Transposition', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            } else {
                // CaesarXOR
                const shift = Math.floor(rand() * 10) + 1;
                const xKey = generateString(4, rand);
                const flag = `flag{cxor_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Caesar+XOR`, description: `Caesar Shift ${shift} then XOR with key: ${xKey}`, points: 200,
                    ciphertext: caesarXor(flag, shift, xKey), type: 'Combined', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            }
        }
        else if (i <= 45) { // 36-45: Hard/Web (SHA256, MD5)
            const pin = Math.floor(rand() * 10000);
            if (i % 2 === 0) {
                // SHA256
                const flag = `flag{${pin}}`;
                const hash = crypto.createHash('sha256').update(pin.toString()).digest('hex');
                createChal({
                    id: `chal_${i}`, title: `SHA256 PIN`, description: 'Crack the 4-digit PIN. SHA256.', points: 1500,
                    ciphertext: hash, type: 'Hash', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            } else {
                // MD5
                const flag = `FLAG{${pin}}`;
                const hash = crypto.createHash('md5').update(pin.toString()).digest('hex');
                createChal({
                    id: `chal_${i}`, title: `MD5 PIN`, description: 'Crack the 4-digit PIN. MD5.', points: 1000,
                    ciphertext: hash, type: 'Hash', category: 'Crypto', flag, flagPattern: 'FLAG{...}'
                });
            }
        }
        else { // 46-55: Bruteforce / Math
            if (i % 2 === 0) {
                const chars = 'abcde';
                let smallKey = '';
                for (let k = 0; k < 3; k++) smallKey += chars.charAt(Math.floor(rand() * chars.length));
                const flag = `flag{bfs_${str}}`;
                createChal({
                    id: `chal_${i}`, title: `Bruteforce Mini`, description: 'Key is 3 chars from known alphabet "abcde".', points: 250,
                    ciphertext: xorEncrypt(flag, smallKey), type: 'Bruteforce', category: 'Crypto', flag, flagPattern: 'flag{...}'
                });
            } else {
                const p1 = [13, 17, 19, 23][Math.floor(rand() * 4)];
                const p2 = [29, 31, 37, 41][Math.floor(rand() * 4)];
                const flag = `flag{${p1}_${p2}}`;
                createChal({
                    id: `chal_${i}`, title: `Factorize`, description: `Find primes for ${p1 * p2}. Format: flag{small_big}`, points: 200,
                    ciphertext: `${p1 * p2}`, type: 'Math', category: 'Logic', flag, flagPattern: 'flag{...}'
                });
            }
        }
    }

    return challenges;
}

module.exports = { getChallenges, getNextRotation };
