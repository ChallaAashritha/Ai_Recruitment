require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");
const { v4: uuidv4 } = require("uuid");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seedAdmin() {
  try {
    await pool.connect();

    const email = "admin@platform.com";
    const plainPassword = "Admin@123";

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    await pool.query(
      `INSERT INTO admins (id, email, password_hash, is_active)
       VALUES ($1, $2, $3, true)`,
      [uuidv4(), email, passwordHash]
    );

    console.log("✅ Admin user created successfully");
    console.log("Email:", email);
    console.log("Password:", plainPassword);

  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
