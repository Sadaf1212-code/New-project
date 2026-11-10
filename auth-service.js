const argon2 = require("argon2");

const ARGON2ID_OPTIONS = Object.freeze({
    type: argon2.argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1,
    hashLength: 32,
    saltLength: 16
});

async function hashPassword(password) {
    if (typeof password !== "string" || password.length === 0) {
        throw new TypeError("Password must be a non-empty string");
    }
    // argon2.hash generates a cryptographically secure random salt and stores
    // the salt, algorithm, and work factors in the PHC encoded result.
    return argon2.hash(password, ARGON2ID_OPTIONS);
}

async function verifyPassword(password, encodedHash) {
    if (typeof password !== "string" || typeof encodedHash !== "string" || !encodedHash.startsWith("$argon2id$")) {
        return false;
    }
    try {
        return await argon2.verify(encodedHash, password, { type: argon2.argon2id });
    } catch {
        return false;
    }
}

module.exports = { hashPassword, verifyPassword };
