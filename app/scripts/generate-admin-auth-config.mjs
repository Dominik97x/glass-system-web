import { randomBytes, scryptSync } from "node:crypto";

const password = process.env.ADMIN_PASSWORD_INPUT;
const username = (process.env.ADMIN_USERNAME_INPUT || "admin").trim();

if (!username) {
  console.error("ADMIN_USERNAME_INPUT nie może być pusty.");
  process.exit(1);
}

if (!password || password.length < 12 || password.length > 256) {
  console.error(
    "Ustaw ADMIN_PASSWORD_INPUT na hasło zawierające od 12 do 256 znaków."
  );
  process.exit(1);
}

const salt = randomBytes(16);
const passwordHash = scryptSync(password, salt, 64);
const sessionSecret = randomBytes(48).toString("base64url");

console.log("");
console.log("Dodaj poniższe wartości do app/.env.local:");
console.log("");
console.log(`ADMIN_USERNAME=${username}`);
console.log(
  `ADMIN_PASSWORD_HASH=scrypt-v1\\${salt.toString("base64url")}\\${passwordHash.toString("base64url")}`
);
console.log(`ADMIN_SESSION_SECRET=${sessionSecret}`);
console.log("ADMIN_SESSION_TTL_HOURS=12");
console.log("");
