/* =========================================================
   Set or change a blog admin password (stored as a scrypt hash).

   Usage:
     node blog/set-password.js <username> <new-password> ["Display Name"]

   Creates the user if it doesn't exist. Restart is NOT needed.
========================================================= */

const fs = require("fs");
const path = require("path");
const { hashPassword } = require("./auth");

const [username, password, name] = process.argv.slice(2);
if (!username || !password) {
  console.log('Usage: node blog/set-password.js <username> <new-password> ["Display Name"]');
  process.exit(1);
}
if (password.length < 8) { console.error("Password must be at least 8 characters."); process.exit(1); }
if (password.length > 100) { console.error("Password must be at most 100 characters."); process.exit(1); }

const file = path.join(__dirname, "..", "data", "blog-config.js");
const config = require(file); // raw file only — .env values are never written here
const user = config.users.find((u) => u.username === username);
if (user) {
  delete user.password;
  user.passwordHash = hashPassword(password);
  if (name) user.name = name;
} else {
  config.users.push({ username, passwordHash: hashPassword(password), name: name || username });
}

const body = `/* =========================================================
   BLOG ADMIN CONFIG
   ---------------------------------------------------------
   Login accounts for the blog admin panel (/blog-admin).
   Passwords are stored as scrypt hashes — never plain text.
   To add a user or change a password run:
     node blog/set-password.js <username> <new-password> ["Display Name"]
========================================================= */

module.exports = ${JSON.stringify(config, null, 2)};
`;
fs.writeFileSync(file + ".tmp", body, "utf8");
fs.renameSync(file + ".tmp", file);
console.log(`✅ Password ${user ? "updated" : "set"} for "${username}".`);
