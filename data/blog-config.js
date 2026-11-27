/* =========================================================
   BLOG ADMIN CONFIG
   ---------------------------------------------------------
   Login accounts for the blog admin panel (/blog-admin).
   Passwords are stored as scrypt hashes — never plain text.
   To add a user or change a password run:
     node blog/set-password.js <username> <new-password> ["Display Name"]
========================================================= */

module.exports = {
  "siteUrl": "https://www.verifitech.com",
  "sessionHours": 8,
  "users": [
    {
      "username": "admin",
      "name": "Verifitech Team",
      "passwordHash": "scrypt$gvtr3Q1FIn+VAQgk/bFD4Q==$tk2sk6+srd43u1tbH5ksY1rjTuVrPUl+YKH61a6m8UfqoumzlteoNSNtYdRC+urWEbFayjZkmypRljIaKA0/WQ=="
    }
  ]
};
