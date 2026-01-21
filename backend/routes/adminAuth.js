const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const pool = require("../db");
const verifyAdminToken = require("../middleware/authMiddleware");

const router = express.Router();

/* =========================
   ADMIN LOGIN
========================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const result = await pool.query(
      "SELECT * FROM admins WHERE email = $1 AND is_active = true",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const admin = result.rows[0];

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign(
      { adminId: admin.id, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = uuidv4();

    await pool.query(
      `INSERT INTO refresh_tokens (id, admin_id, token, expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')`,
      [uuidv4(), admin.id, refreshToken]
    );

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error("LOGIN ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN DASHBOARD (PROTECTED)
========================= */
router.get("/dashboard", verifyAdminToken, (req, res) => {
  res.json({
    message: "Welcome Admin",
    admin: req.admin
  });
});

/* =========================
   CREATE RECRUITER (ADMIN ONLY)
========================= */
router.post("/recruiters", verifyAdminToken, async (req, res) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Check if recruiter already exists
    const existing = await pool.query(
      "SELECT id FROM recruiters WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Recruiter already exists" });
    }

    // Hash recruiter password
    const passwordHash = await bcrypt.hash(password, 10);

    const recruiterId = uuidv4();

    // Insert recruiter
    await pool.query(
      `INSERT INTO recruiters (id, name, email, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')`,
      [recruiterId, name, email, passwordHash]
    );

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action)
       VALUES ($1, $2, 'ADMIN', $3)`,
      [uuidv4(), req.admin.adminId, `Created recruiter: ${email}`]
    );

    res.status(201).json({
      message: "Recruiter created successfully"
    });

  } catch (err) {
    console.error("CREATE RECRUITER ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* =========================
   GET ALL RECRUITERS (ADMIN)
========================= */
router.get("/recruiters", verifyAdminToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, status, created_at
       FROM recruiters
       ORDER BY created_at DESC`
    );

    res.json({
      recruiters: result.rows
    });

  } catch (err) {
    console.error("GET RECRUITERS ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* =========================
   BLOCK / UNBLOCK RECRUITER
========================= */
router.patch("/recruiters/:id/status", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["ACTIVE", "BLOCKED"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const result = await pool.query(
      "UPDATE recruiters SET status = $1 WHERE id = $2 RETURNING email",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    // Audit log
    await pool.query(
      `INSERT INTO audit_logs (id, actor_id, actor_role, action)
       VALUES ($1, $2, 'ADMIN', $3)`,
      [
        uuidv4(),
        req.admin.adminId,
        `Recruiter ${result.rows[0].email} set to ${status}`
      ]
    );

    res.json({
      message: `Recruiter ${status.toLowerCase()} successfully`
    });

  } catch (err) {
    console.error("UPDATE RECRUITER STATUS ERROR 👉", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   REFRESH TOKEN
========================= */
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const storedToken = result.rows[0];

    const newAccessToken = jwt.sign(
      { adminId: storedToken.admin_id, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LOGOUT
========================= */
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  await pool.query(
    "DELETE FROM refresh_tokens WHERE token = $1",
    [refreshToken]
  );

  res.json({ message: "Logged out successfully" });
});

module.exports = router;
