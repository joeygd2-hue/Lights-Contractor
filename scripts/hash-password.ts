/**
 * Prints an ADMIN_PASSWORD_HASH value for .env.
 * Usage: npm run admin:hash -- "a long, unique password"
 */
import { randomBytes, scrypt } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: npm run admin:hash -- "a password of at least 12 characters"');
  process.exit(1);
}
const salt = randomBytes(16);
scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, hash) => {
  if (err) throw err;
  console.log(`scrypt:${salt.toString("base64")}:${hash.toString("base64")}`);
});
