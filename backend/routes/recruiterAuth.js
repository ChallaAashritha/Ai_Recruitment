const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../db");

const router = express.Router();

/* =========================
   RECRUITER LOGIN
========================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT * FROM recruiters WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const recruiter = result.rows[0];

    // ❌ Blocked recruiter
    if (recruiter.status === "BLOCKED") {
      return res.status(403).json({
        message: "Your account is blocked. Contact admin."
      });
    }

    const isMatch = await bcrypt.compare(password, recruiter.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { recruiterId: recruiter.id, role: "RECRUITER" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful",
      accessToken: token
    });

  } catch (err) {
    console.error("RECRUITER LOGIN ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
